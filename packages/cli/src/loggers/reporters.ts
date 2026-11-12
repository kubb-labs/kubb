import process from 'node:process'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { isPathInside } from '@internals/utils'
import type { GenerationResult, Hookable, KubbGenerationEndContext, KubbHooks, Reporter, ReporterContext } from '@kubb/core'
import { cacheStorage, createCliReporter, createOutputManifest, hasOutputPasses, logLevel as logLevelMap } from '@kubb/core'
import { writer as defaultWriter } from '../ui/log.ts'
import { installLogger } from './features/index.ts'
import type { LoggerWriter } from './types.ts'
import {
  type ChangeTally,
  createChangeTally,
  diffFile,
  diffOutput,
  type FileFingerprint,
  readOutputFiles,
  readOutputFingerprints,
  tallyChange,
} from '../runners/generate/utils.ts'

type LiveChanges = {
  tally: ChangeTally
  // The files `output.clean` is about to delete, the only trace of them once the folder is emptied.
  fingerprints: Map<string, FileFingerprint>
  processed: Set<string>
}

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
  // Read-back runs only: the whole output as it was before generation.
  let previous: Map<string, string> | undefined
  let reading: Promise<Map<string, string>> | undefined
  // A run without output passes counts each file as it is written, against the stored text the write already read.
  let live: LiveChanges | undefined
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
    const tracked = trackChanges && (dryRun || config.storage?.name === 'fs')
    live = ((): LiveChanges | undefined => {
      // Output passes rewrite stored files and a dry run compares through the manifest, so both read the output back.
      if (!tracked || dryRun || hasOutputPasses(config)) return undefined
      return { tally: createChangeTally(), fingerprints: new Map(), processed: new Set() }
    })()
    // Read while the plugins generate; `kubb:plugins:end` waits for it, before cleaning can erase the baseline.
    reading = tracked && !live ? readOutputFiles(outputPath) : undefined
  })
  context.hook('kubb:plugins:end', async ({ config }) => {
    if (reading) previous = await reading
    // The last moment the old files exist: the storage empties the folder right after this hook.
    if (live && config.output.clean) live.fingerprints = await readOutputFingerprints(outputPath)
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
  context.hook('kubb:file:processed', ({ file, source, stored = null }) => {
    if (!live) return
    // The storage writes the trimmed source and skips a blank one, which leaves the stored file as it was.
    const next = source.trim()
    if (!next) return
    live.processed.add(file.path)
    tallyChange({ tally: live.tally, change: diffFile({ path: file.path, next, previous: stored ?? live.fingerprints.get(file.path) ?? null }) })
  })
  context.hook('kubb:files:processing:end', ({ files, unchanged }) => {
    filesUnchanged = unchanged.length
    paths = files.map((file) => file.path)
  })

  /** The run's totals: counted while writing, or worked out by reading the output back. */
  async function countChanges({ config, storage }: Pick<KubbGenerationEndContext, 'config' | 'storage'>): Promise<ChangeTally | undefined> {
    if (live) {
      const { tally, fingerprints, processed } = live
      const generated = new Set(paths)
      for (const [filePath, fingerprint] of fingerprints) {
        if (!generated.has(filePath)) tallyChange({ tally, change: { status: 'D', path: filePath, removed: fingerprint.deletedLines } })
      }
      // A blank file left whatever the storage held in place, so a stored copy counts as unchanged.
      for (const filePath of paths) {
        if (!processed.has(filePath) && (await storage.readItem(filePath)) !== null) tally.unchanged++
      }
      return tally
    }
    if (!previous) return undefined
    const manifest = dryRun ? await createOutputManifest({ storage, cache: cacheStorage({ root: config.root }) }) : undefined
    const diff = await diffOutput({ storage, paths, clean: Boolean(config.output.clean), manifest, previousFiles: previous })
    const changes = createChangeTally()
    changes.unchanged = diff.unchanged
    for (const file of diff.files) tallyChange({ tally: changes, change: file })
    return changes
  }

  context.hook('kubb:generation:end', async ({ config, storage, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
    const result: GenerationResult = { config, diagnostics, filesCreated, filesUnchanged, dryRun, status, hrStart }
    const cliResult = { ...result }
    const counted = status === 'failed' ? undefined : await countChanges({ config, storage })
    if (counted) {
      const { unchanged, ...changes } = counted
      cliResult.filesCreated = changes.added + changes.modified + unchanged
      cliResult.filesUnchanged = unchanged
      cliResult.fileChanges = changes
    }
    live = undefined
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
