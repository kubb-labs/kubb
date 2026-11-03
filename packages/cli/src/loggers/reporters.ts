import process from 'node:process'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { isPathInside } from '@internals/utils'
import type { GenerationResult, Hookable, KubbHooks, Reporter, ReporterContext } from '@kubb/core'
import { cacheStorage, createCliReporter, createOutputManifest, hasOutputPasses, logLevel as logLevelMap } from '@kubb/core'
import { writer as defaultWriter } from '../ui/log.ts'
import { installLogger } from './features/index.ts'
import type { LoggerWriter } from './types.ts'
import { diffFile, diffOutput, type FileChange, readOutputFiles } from '../runners/generate/utils.ts'

/** Installs the live logger and wires the selected reporters. `cli` renders its summary through the logger, and is skipped when `json` owns stdout. */
function setupReporters(
  context: Hookable<KubbHooks>,
  {
    logLevel,
    reporters,
    writer = defaultWriter(),
    dryRun = false,
    fileChanges = false,
  }: {
    /** Output verbosity. Use the `logLevel` constants exported from `@kubb/core`. */
    logLevel: number
    reporters: ReadonlyArray<Reporter>
    /** Overrides the terminal-based pick, e.g. the plain writer for `kubb studio snapshot`. */
    writer?: LoggerWriter
    /**
     * Labels the memory-backed generation as a preview rather than a completed write.
     */
    dryRun?: boolean
    /**
     * Hands `fileChanges` to every reporter, not only `cli`.
     */
    fileChanges?: boolean
  },
): void {
  const hasJson = reporters.some((reporter) => reporter.name === 'json')
  const selected = reporters.flatMap((reporter) => {
    if (reporter.name !== 'cli') return [reporter]
    if (hasJson) return []
    return [createCliReporter({ render: installLogger({ hooks: context, writer, logLevel }).renderSummary })]
  })
  const ctx: ReporterContext = { logLevel }
  const pluginFiles = selected.some((reporter) => reporter.needsPluginFiles) ? new Map<string, Array<string>>() : undefined
  const seen = new Set<string>()
  if (pluginFiles) {
    context.hook('kubb:plugin:end', ({ plugin, files }) => {
      for (const file of files) {
        if (seen.has(file.path)) continue
        seen.add(file.path)
        const paths = pluginFiles.get(plugin.name) ?? []
        paths.push(file.path)
        pluginFiles.set(plugin.name, paths)
      }
    })
  }

  // Configs generate one at a time, so the last write before `kubb:generation:end` is this config's.
  let filesUnchanged = 0
  let previous: Map<string, string> | undefined
  let reading: Promise<Map<string, string>> | undefined
  // Changes worked out from each source as it is written, so the summary does not read the output back.
  let counted: Map<string, FileChange | undefined> | undefined
  let paths: Array<string> = []
  let outputPath = ''
  const trackChanges = (fileChanges || selected.some((reporter) => reporter.name === 'cli')) && logLevel > logLevelMap.silent
  context.hook('kubb:generation:start', ({ config }) => {
    pluginFiles?.clear()
    seen.clear()
    filesUnchanged = 0
    paths = []
    outputPath = resolve(config.root, config.output.path)
    previous = undefined
    // Read while the plugins generate; `kubb:plugins:end` waits for it, before cleaning can erase the baseline.
    reading = trackChanges && (dryRun || config.storage?.name === 'fs') ? readOutputFiles(outputPath) : undefined
    // Output passes rewrite stored files and a dry run compares through the manifest, so both read the output back.
    counted = reading && !dryRun && !hasOutputPasses(config) ? new Map() : undefined
  })
  context.hook('kubb:plugins:end', async () => {
    if (reading) previous = await reading
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
  context.hook('kubb:file:processed', ({ file, source }) => {
    if (!counted || !previous) return
    // The storage writes the trimmed source and skips a blank one.
    const next = source.trim()
    if (next) counted.set(file.path, diffFile({ path: file.path, next, previous: previous.get(file.path) ?? null }))
  })
  context.hook('kubb:files:processing:end', ({ files, unchanged }) => {
    filesUnchanged = unchanged.length
    paths = files.map((file) => file.path)
  })

  context.hook('kubb:generation:end', async ({ config, storage, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
    const result: GenerationResult = { config, diagnostics, filesCreated, filesUnchanged, dryRun, status, hrStart }
    const cliResult = { ...result }
    if (previous && status !== 'failed') {
      const manifest = dryRun ? await createOutputManifest({ storage, cache: cacheStorage({ root: config.root }) }) : undefined
      const diff = await diffOutput({
        storage,
        paths,
        clean: Boolean(config.output.clean),
        manifest,
        previousFiles: previous,
        counted,
      })
      const changes = { added: 0, modified: 0, deleted: 0, linesAdded: 0, linesRemoved: 0 }
      const counts = { A: 'added', M: 'modified', D: 'deleted' } as const
      for (const file of diff.files) {
        changes[counts[file.status]]++
        changes.linesAdded += file.added ?? 0
        changes.linesRemoved += file.removed ?? 0
      }
      cliResult.filesCreated = changes.added + changes.modified + diff.unchanged
      cliResult.filesUnchanged = diff.unchanged
      cliResult.fileChanges = changes
    }
    for (const reporter of selected) {
      const grouped = reporter.needsPluginFiles && pluginFiles?.size ? [...pluginFiles].map(([plugin, files]) => ({ plugin, files: [...files] })) : undefined
      await reporter.report({ ...(reporter.name === 'cli' || fileChanges ? cliResult : result), pluginFiles: grouped }, ctx)
    }
  })

  context.hook('kubb:lifecycle:end', async () => {
    for (const reporter of selected) await reporter.drain?.(ctx)
  })
}

export default setupReporters

/** Picks the reporters whose `name` is in `names`, in the given order (the CLI maps `--reporter` to this); duplicates and unknown names are skipped. */
export function selectReporters(reporters: ReadonlyArray<Reporter>, names: ReadonlyArray<string>): Array<Reporter> {
  return [...new Set(names)].flatMap((name) => reporters.find((reporter) => reporter.name === name) ?? [])
}
