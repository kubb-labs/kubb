import process from 'node:process'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { isPathInside, memo } from '@internals/utils'
import type { Config, GenerationResult, Hookable, KubbGenerationEndContext, KubbHooks, Reporter, ReporterContext } from '@kubb/core'
import { createCliReporter, createLockfile, hasOutputPasses, logLevel as logLevelMap } from '@kubb/core'
import { writer as defaultWriter } from '../ui/log.ts'
import { installLogger } from './features/index.ts'
import type { LoggerWriter } from './types.ts'
import type { OutputCheck } from '../runners/generate/check.ts'
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

type GenerationRun = {
  outputPath: string
  filesUnchanged: number
  paths: Set<string>
  // Read-back runs only: the whole output as it was before generation.
  previous?: Map<string, string>
  reading?: Promise<Map<string, string>>
  // A run without output passes counts each file as it is written, against the stored text the write already read.
  live?: LiveChanges
}

/** The totals of a check, from the files it found out of date. */
function tallyCheck({ files, unchanged }: { files: NonNullable<GenerationResult['check']>['files']; unchanged: number }): ChangeTally {
  const tally = createChangeTally()
  tally.unchanged = unchanged
  for (const file of files) {
    tally[file.status]++
    tally.linesAdded += file.linesAdded
    tally.linesRemoved += file.linesRemoved
  }
  return tally
}

async function tallyLive({
  live,
  paths,
  storage,
}: Pick<KubbGenerationEndContext, 'storage'> & { live: LiveChanges; paths: Set<string> }): Promise<ChangeTally> {
  const { tally, fingerprints, processed } = live
  for (const [filePath, fingerprint] of fingerprints) {
    if (!paths.has(filePath)) tallyChange({ tally, change: { status: 'D', path: filePath, removed: fingerprint.deletedLines } })
  }
  // A blank file left whatever the storage held in place, so a stored copy counts as unchanged.
  for (const filePath of paths.difference(processed)) {
    if ((await storage.readItem(filePath)) !== null) tally.unchanged++
  }
  return tally
}

export type ReportersOptions = {
  context: Hookable<KubbHooks>
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
  /**
   * Compares the generated files with the output on disk for `--check`, at every log level and for every reporter.
   */
  outputCheck?: Pick<OutputCheck, 'compare' | 'original'>
}

// The `cli` result shows the counted changes, including files the run left as they were.
function withChanges({
  result,
  counted,
}: {
  result: GenerationResult
  counted: (ChangeTally & { check?: GenerationResult['check'] }) | undefined
}): GenerationResult {
  if (!counted) return { ...result }
  const { unchanged, check, ...changes } = counted
  return { ...result, filesCreated: changes.added + changes.modified + unchanged, filesUnchanged: unchanged, fileChanges: changes, check }
}

class Reporters {
  readonly #selected: Array<Reporter>
  readonly #ctx: ReporterContext
  readonly #pluginFiles: Map<string, Array<string>> | undefined
  readonly #seen = new Set<string>()
  readonly #trackChanges: boolean
  readonly #dryRun: boolean
  readonly #outputCheck: ReportersOptions['outputCheck']
  // Configs generate one at a time, so the last write before `kubb:generation:end` is this config's.
  #run: GenerationRun | undefined

  constructor({ context, logLevel, reporters, writer = defaultWriter(), dryRun = false, fileChanges = false, outputCheck }: ReportersOptions) {
    const hasJson = reporters.some((reporter) => reporter.name === 'json')
    this.#selected = reporters.flatMap((reporter) => {
      if (reporter.name !== 'cli') return [reporter]
      if (hasJson) return []
      return [createCliReporter({ render: installLogger({ hooks: context, writer, logLevel }).renderSummary })]
    })
    this.#ctx = { logLevel }
    this.#dryRun = dryRun
    this.#outputCheck = outputCheck
    const pluginFiles = this.#selected.some((reporter) => reporter.needsPluginFiles) ? memo.create<string, Array<string>>() : undefined
    this.#pluginFiles = pluginFiles
    if (pluginFiles) {
      context.hook('kubb:plugin:end', ({ plugin, files }) => {
        for (const file of files) {
          if (this.#seen.has(file.path)) continue
          this.#seen.add(file.path)
          memo(pluginFiles, plugin.name, () => []).push(file.path)
        }
      })
    }

    this.#trackChanges = (fileChanges || this.#selected.some((reporter) => reporter.name === 'cli')) && logLevel > logLevelMap.silent
    context.hook('kubb:generation:start', ({ config }) => {
      this.#pluginFiles?.clear()
      this.#seen.clear()
      const outputPath = resolve(config.root, config.output.path)
      const tracked = !outputCheck && this.#trackChanges && (dryRun || config.storage?.name === 'fs')
      const live = ((): LiveChanges | undefined => {
        // Output passes rewrite stored files and a dry run compares through the lockfile, so both read the output back.
        if (!tracked || dryRun || hasOutputPasses(config)) return undefined
        return { tally: createChangeTally(), fingerprints: new Map(), processed: new Set() }
      })()
      this.#run = {
        outputPath,
        filesUnchanged: 0,
        paths: new Set(),
        live,
        // Read while the plugins generate; `kubb:plugins:end` waits for it, before cleaning can erase the baseline.
        reading: tracked && !live ? readOutputFiles(outputPath) : undefined,
      }
    })
    context.hook('kubb:plugins:end', async ({ config }) => {
      const run = this.#run
      if (!run) return
      if (run.reading) run.previous = await run.reading
      // The last moment the old files exist: the storage empties the folder right after this hook.
      if (run.live && config.output.clean) run.live.fingerprints = await readOutputFingerprints(run.outputPath)
    })
    context.hook('kubb:files:processing:start', async ({ files }) => {
      const run = this.#run
      if (!run?.previous) return
      const { previous, outputPath } = run
      // Plugin output can live outside the main output folder; capture it before writes start.
      for (const file of files) {
        if (previous.has(file.path) || isPathInside(outputPath, file.path)) continue
        const source = await readFile(file.path, 'utf8').catch(() => null)
        if (source !== null) previous.set(file.path, source)
      }
    })
    context.hook('kubb:file:processed', ({ file, source, stored = null }) => {
      const live = this.#run?.live
      if (!live) return
      // The storage writes the trimmed source and skips a blank one, which leaves the stored file as it was.
      const next = source.trim()
      if (!next) return
      live.processed.add(file.path)
      tallyChange({ tally: live.tally, change: diffFile({ path: file.path, next, previous: stored ?? live.fingerprints.get(file.path) ?? null }) })
    })
    context.hook('kubb:files:processing:end', ({ files, unchanged }) => {
      const run = this.#run
      if (!run) return
      run.filesUnchanged = unchanged.length
      run.paths = new Set(files.map((file) => file.path))
    })

    // A check reports on the config the user wrote, not on the copy prepared to write nothing.
    const reportedConfig = (config: Config): Config => outputCheck?.original(config) ?? config
    // A check writes nothing to the output either, and every reporter gets its file changes.
    const writesNothing = dryRun || Boolean(outputCheck)
    const changesForAll = fileChanges || Boolean(outputCheck)

    context.hook('kubb:generation:end', async ({ config, storage, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
      const current = this.#run
      this.#run = undefined
      const result: GenerationResult = {
        config: reportedConfig(config),
        diagnostics,
        filesCreated,
        filesUnchanged: current?.filesUnchanged ?? 0,
        dryRun: writesNothing,
        status,
        hrStart,
      }
      const counted = current && status !== 'failed' ? await this.#countChanges({ config, storage, current }) : undefined
      await this.#report({ result, cliResult: withChanges({ result, counted }), changesForAll })
    })

    context.hook('kubb:lifecycle:end', async () => {
      for (const reporter of this.#selected) await reporter.drain?.(this.#ctx)
    })
  }

  async #report({ result, cliResult, changesForAll }: { result: GenerationResult; cliResult: GenerationResult; changesForAll: boolean }): Promise<void> {
    const pluginFiles = this.#pluginFiles
    for (const reporter of this.#selected) {
      const grouped = reporter.needsPluginFiles && pluginFiles?.size ? [...pluginFiles].map(([plugin, files]) => ({ plugin, files: [...files] })) : undefined
      await reporter.report({ ...(reporter.name === 'cli' || changesForAll ? cliResult : result), pluginFiles: grouped }, this.#ctx)
    }
  }

  /** The run's totals: counted while writing, or worked out by reading the output back. */
  async #countChanges({
    config,
    storage,
    current,
  }: Pick<KubbGenerationEndContext, 'config' | 'storage'> & { current: GenerationRun }): Promise<
    (ChangeTally & { check?: GenerationResult['check'] }) | undefined
  > {
    const { live, paths, previous } = current
    const outputCheck = this.#outputCheck
    if (outputCheck) {
      const { unchanged, ...check } = await outputCheck.compare({ config, storage, paths })
      return { ...tallyCheck({ files: check.files, unchanged }), check }
    }
    if (live) return tallyLive({ live, paths, storage })
    if (!previous) return undefined
    const lockfile = this.#dryRun ? await createLockfile({ storage, root: config.root }) : undefined
    const diff = await diffOutput({ storage, paths, clean: Boolean(config.output.clean), lockfile, previousFiles: previous })
    const changes = createChangeTally()
    changes.unchanged = diff.unchanged
    for (const file of diff.files) tallyChange({ tally: changes, change: file })
    return changes
  }
}

/** Installs the live logger and wires the selected reporters. `cli` renders its summary through the logger, and is skipped when `json` owns stdout. */
function installReporters(options: ReportersOptions): Reporters {
  return new Reporters(options)
}

export default installReporters

/** Picks the reporters whose `name` is in `names`, in the given order (the CLI maps `--reporter` to this); duplicates and unknown names are skipped. */
export function selectReporters(reporters: ReadonlyArray<Reporter>, names: ReadonlyArray<string>): Array<Reporter> {
  return [...new Set(names)].flatMap((name) => reporters.find((reporter) => reporter.name === name) ?? [])
}
