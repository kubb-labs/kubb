import process from 'node:process'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { isPathInside } from '@internals/utils'
import type { Config, Hookable, KubbHooks, Reporter, ReporterContext, ReporterPluginFiles } from '@kubb/core'
import { cacheStorage, createCliReporter, createOutputManifest, logLevel as logLevelMap } from '@kubb/core'
import { isRichOutput } from '../utils/env.ts'
import type { Logger, LoggerOptions } from './defineLogger.ts'
import { clackLogger } from './clackLogger.ts'
import { plainLogger } from './plainLogger.ts'
import { planDryRun, readOutputFiles } from '../runners/generate/utils.ts'

/** Bridges a {@link Reporter} onto the hook emitter: calls `report` with each config's {@link GenerationResult} on `kubb:generation:end`. */
function installReporter(context: Hookable<KubbHooks>, reporter: Reporter, ctx: ReporterContext, dryRun: boolean): void {
  const pluginFiles = reporter.needsPluginFiles ? new Map<Config, Map<string, Set<string>>>() : undefined

  if (pluginFiles) {
    context.hook('kubb:plugin:end', ({ config, plugin, files }) => {
      const filesByPlugin = pluginFiles.get(config) ?? new Map<string, Set<string>>()
      const seen = new Set([...filesByPlugin.values()].flatMap((paths) => [...paths]))
      const added = files.filter((file) => !seen.has(file.path)).map((file) => file.path)

      if (added.length) filesByPlugin.set(plugin.name, new Set([...(filesByPlugin.get(plugin.name) ?? []), ...added]))

      pluginFiles.set(config, filesByPlugin)
    })
  }

  // Configs generate one at a time, so the last write before `kubb:generation:end` is this config's.
  let filesUnchanged = 0
  let previous: Map<string, string> | undefined
  let paths: Array<string> = []
  let outputPath = ''
  context.hook('kubb:generation:start', async ({ config }) => {
    filesUnchanged = 0
    paths = []
    outputPath = resolve(config.root, config.output.path)
    previous =
      reporter.name === 'cli' && ctx.logLevel > logLevelMap.silent && (dryRun || config.storage?.name === 'fs') ? await readOutputFiles(outputPath) : undefined
  })
  context.hook('kubb:files:processing:start', async ({ files }) => {
    if (!previous) return
    // Plugin output can live outside the main output folder; capture it before writes start.
    for (const file of files) {
      if (previous.has(file.path) || isPathInside(outputPath, file.path)) continue
      const source = await readFile(file.path, 'utf8').catch(() => null)
      if (source !== null) previous.set(file.path, source)
    }
  })
  context.hook('kubb:files:processing:end', ({ files, unchanged }) => {
    filesUnchanged = unchanged.length
    paths = files.map((file) => file.path)
  })

  context.hook('kubb:generation:end', async ({ config, storage, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
    const files = pluginFiles?.get(config)
    const grouped: ReporterPluginFiles | undefined = files && [...files].map(([plugin, paths]) => ({ plugin, files: [...paths] }))

    const changes = await (async () => {
      if (!previous || status === 'failed') return undefined
      const manifest = dryRun ? await createOutputManifest({ storage, cache: cacheStorage({ root: config.root }) }) : undefined
      const diff = await planDryRun({
        storage,
        paths,
        outputPath: resolve(config.root, config.output.path),
        clean: Boolean(config.output.clean),
        manifest,
        previousFiles: previous,
      })
      return {
        unchanged: diff.unchanged,
        fileChanges: {
          added: diff.files.filter((file) => file.status === 'A').length,
          modified: diff.files.filter((file) => file.status === 'M').length,
          deleted: diff.files.filter((file) => file.status === 'D').length,
          linesAdded: diff.files.reduce((sum, file) => sum + (file.added ?? 0), 0),
          linesRemoved: diff.files.reduce((sum, file) => sum + (file.removed ?? 0), 0),
        },
      }
    })()

    await reporter.report(
      {
        config,
        diagnostics,
        filesCreated: changes ? changes.fileChanges.added + changes.fileChanges.modified + changes.unchanged : filesCreated,
        filesUnchanged: changes?.unchanged ?? filesUnchanged,
        fileChanges: changes?.fileChanges,
        dryRun,
        status,
        hrStart,
        pluginFiles: grouped,
      },
      ctx,
    )

    pluginFiles?.delete(config)
  })

  if (reporter.drain) {
    context.hook('kubb:lifecycle:end', () => reporter.drain?.(ctx))
  }
}

/** Installs the live logger and wires the selected reporters. `cli` renders its summary through the logger, and is skipped when `json` owns stdout. */
function setupReporters(
  context: Hookable<KubbHooks>,
  {
    logLevel,
    reporters,
    logger: forcedLogger,
    dryRun = false,
  }: LoggerOptions & {
    reporters: ReadonlyArray<Reporter>
    /** Overrides the terminal-based pick, e.g. the plain logger for `kubb studio snapshot`. */
    logger?: Logger
    /**
     * Labels the memory-backed generation as a preview rather than a completed write.
     */
    dryRun?: boolean
  },
): void {
  const hasJson = reporters.some((reporter) => reporter.name === 'json')
  const ctx: ReporterContext = { logLevel }

  for (const reporter of reporters) {
    if (reporter.name !== 'cli') {
      installReporter(context, reporter, ctx, dryRun)
      continue
    }

    if (hasJson) {
      continue
    }

    const logger = forcedLogger ?? (isRichOutput() ? clackLogger : plainLogger)
    const handle = logger(context, { logLevel })

    // The summary belongs inside the group the logger opened for this config, so the logger writes it.
    installReporter(context, createCliReporter({ render: handle?.renderSummary }), ctx, dryRun)
  }
}

export default setupReporters

/** Picks the reporters whose `name` is in `names`, in the given order (the CLI maps `--reporter` to this); duplicates and unknown names are skipped. */
export function selectReporters(reporters: ReadonlyArray<Reporter>, names: ReadonlyArray<string>): Array<Reporter> {
  return [...new Set(names)].flatMap((name) => reporters.find((reporter) => reporter.name === name) ?? [])
}
