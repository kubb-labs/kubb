import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { diffHunks, inParallel, isPathInside, listFiles, read, toPosixPath } from '@internals/utils'
import { type Config, Diagnostics, fsStorage, type GenerateOptions, type GenerationResult, runOutputPasses, type Storage } from '@kubb/core'
import { formatPatch } from 'diff'
import { diffFile, type FileChange, fingerprintFile, statusKeys } from './utils.ts'

/**
 * What `kubb generate --check` needs for one run: the configs staged in a temporary folder, the
 * output passes for the staged files, and the comparison with the files on disk.
 */
export type OutputCheck = {
  /**
   * The configs to generate instead: each writes to a temporary folder. Throws for a config a check cannot compare.
   */
  stage(configs: ReadonlyArray<Config>): Array<Config>
  processOutput: NonNullable<GenerateOptions['processOutput']>
  /**
   * The config as the user wrote it, for a config from `stage`.
   */
  userConfig(config: Config): Config
  compare(options: { config: Config; storage: Storage; paths: ReadonlySet<string> }): Promise<NonNullable<GenerationResult['check']> & { unchanged: number }>
  /**
   * `true` once any config's output differs from the files on disk.
   */
  readonly changed: boolean
  /**
   * One unified diff per changed file, filled only with `diff`.
   */
  patches: Array<string>
  cleanup(): void
}

type Stage = { userConfig: Config; root: string; stageDir: string }

// Carried on each staged config. Core copies it when it resolves the config, so two configs with the same output folder keep their own stage.
const stageKey = Symbol('kubb.check.stage')
type StagedConfig = Config & { [stageKey]?: Stage }

const stageOf = (config: StagedConfig): Stage => config[stageKey]!

/** The real path of a generated file: a path in the temporary folder maps back to its place under the root. */
function toDiskPath({ root, stageDir }: Stage, filePath: string): string {
  return isPathInside(filePath, stageDir) ? join(root, relative(stageDir, filePath)) : filePath
}

/**
 * The fs storage of a check. A plugin can write next to `output.path`, so every key inside the root
 * moves into the temporary folder, and a key outside the root is refused.
 */
function stagedStorage({ root, stageDir }: Pick<Stage, 'root' | 'stageDir'>): Storage {
  const fs = fsStorage()
  const toStagedPath = (key: string): string => {
    const absolute = resolve(key)
    if (isPathInside(absolute, stageDir)) return absolute
    if (isPathInside(absolute, root)) return join(stageDir, relative(root, absolute))

    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `--check cannot generate "${absolute}" because it is outside the project root.`,
      help: 'Keep every generated file inside `root`.',
    })
  }

  return {
    name: fs.name,
    readItem: (key) => fs.readItem(toStagedPath(key)),
    writeItem: (key, value, options) => fs.writeItem(toStagedPath(key), value, options),
    removeItem: (key) => fs.removeItem(toStagedPath(key)),
    readKeys: (base) => fs.readKeys(base && toStagedPath(base)),
    empty: async (base) => (base ? fs.empty(toStagedPath(base)) : undefined),
  }
}

/** The path of `absolute` below `root`. Throws when it sits outside, since the temporary folder mirrors the project root. */
function relativeToRoot({ root, absolute, option }: { root: string; absolute: string; option: string }): string {
  const path = relative(root, absolute)
  if (path && isPathInside(absolute, root)) return path

  throw new Diagnostics.Error({
    code: Diagnostics.code.unknown,
    severity: 'error',
    message: `--check cannot compare \`${option}\` "${absolute}" because it is not a folder inside the project root.`,
    help: `Point \`${option}\` at a folder inside \`root\`, such as \`./src/gen\`.`,
  })
}

/** A generated folder that takes the place of the real one while the output passes run. */
type Swap = { real: string; staged: string; original: string; movedOriginal: boolean; movedStaged: boolean; createdParent?: string }

const originalsDir = (stageDir: string): string => `${stageDir}-original`

/** Moves the staged folder to its real path and the folder there out of the way. `swap` records each step, so `swapOut` undoes only what happened. */
function swapIn(swap: Swap): void {
  if (existsSync(swap.real)) {
    mkdirSync(dirname(swap.original), { recursive: true })
    renameSync(swap.real, swap.original)
    swap.movedOriginal = true
  }
  // Nothing generated there: the real path stays empty, so no tool rewrites the user's files.
  if (!existsSync(swap.staged)) return
  swap.createdParent = mkdirSync(dirname(swap.real), { recursive: true })
  renameSync(swap.staged, swap.real)
  swap.movedStaged = true
}

/** Moves the generated folder back to the temporary folder and restores the real one. Safe to call twice. */
function swapOut(swap: Swap): void {
  if (swap.movedStaged && existsSync(swap.real)) renameSync(swap.real, swap.staged)
  swap.movedStaged = false
  if (swap.movedOriginal) renameSync(swap.original, swap.real)
  swap.movedOriginal = false
  // No folder to restore: drop the parents that were only made to hold the generated one.
  if (swap.createdParent) rmSync(swap.createdParent, { recursive: true, force: true })
  swap.createdParent = undefined
}

type CheckedFile = NonNullable<GenerationResult['check']>['files'][number]

/** A file a check found out of date, with its unified diff when `--diff` asks for one. */
type StaleFile = { file: CheckedFile; patch?: string }

function toStaleFile({ change, root, texts }: { change: FileChange; root: string; texts?: { before: string; after: string } }): StaleFile {
  const path = toPosixPath(relative(root, change.path))
  const file = { path, status: statusKeys[change.status], linesAdded: change.added ?? 0, linesRemoved: change.removed ?? 0 }
  if (!texts) return { file }
  const { hunks } = diffHunks(texts.before, texts.after)

  return { file, patch: formatPatch({ oldFileName: `a/${path}`, newFileName: `b/${path}`, oldHeader: undefined, newHeader: undefined, hunks }).trimEnd() }
}

/**
 * Adds the files `output.clean` would delete to `stale`: on disk under `output.path`, but not generated.
 * Only these are read, one at a time, for their line count.
 */
async function addDeletedFiles({
  stage,
  generated,
  diff,
  stale,
}: {
  stage: Stage
  generated: ReadonlySet<string>
  diff: boolean
  stale: Array<StaleFile>
}): Promise<void> {
  const outputPath = resolve(stage.root, stage.userConfig.output.path)
  for await (const name of listFiles(outputPath)) {
    const filePath = join(outputPath, name)
    if (generated.has(filePath)) continue
    const source = await read(filePath).catch(() => null)
    if (source === null) continue
    const change = { status: 'D', path: filePath, added: 0, removed: fingerprintFile(source).deletedLines } as const
    stale.push(toStaleFile({ change, root: stage.root, texts: diff ? { before: source, after: '' } : undefined }))
  }
}

/**
 * Sets up a check run. Each config generates into `<root>/.kubb-check-<random>/<output.path>` with the fs
 * storage, so the build never writes to `output.path`.
 *
 * The formatter and linter run on the real `output.path`: the generated folder is swapped in for the
 * passes and the user's folder is put back right after. A tool applies its ignore rules and overrides
 * by path, so only the real path gives the result a plain `kubb generate` gets.
 *
 * `output.postGenerate` does not run: its commands name their own paths and would write to the real output.
 */
export function createOutputCheck({ diff }: { diff: boolean }): OutputCheck {
  const stageDirs = new Map<string, string>()
  const patches: Array<string> = []
  const swaps = new Set<Swap>()
  let changed = false

  // Without a listener a signal ends the process at once and leaves the generated folder at `output.path`.
  const interrupt = { SIGINT: () => process.exit(130), SIGTERM: () => process.exit(143) }
  const cleanup = () => {
    process.off('exit', cleanup)
    for (const [signal, listener] of Object.entries(interrupt)) process.off(signal, listener)
    // The user's files go back first: the folders removed below hold them during a swap.
    for (const swap of swaps) swapOut(swap)
    swaps.clear()
    for (const stageDir of stageDirs.values()) {
      rmSync(stageDir, { recursive: true, force: true })
      rmSync(originalsDir(stageDir), { recursive: true, force: true })
    }
  }
  // A backstop for `process.exit()`, which skips every `finally`.
  process.once('exit', cleanup)
  for (const [signal, listener] of Object.entries(interrupt)) process.once(signal, listener)

  /** Runs `run` with the generated `folders` at their real paths. The user's folders are back when it settles. */
  const withRealPaths = async <T>({ stage, folders, run }: { stage: Stage; folders: Array<string>; run: () => Promise<T> }): Promise<T> => {
    const active: Array<Swap> = []
    try {
      for (const staged of folders) {
        const swap: Swap = {
          real: toDiskPath(stage, staged),
          staged,
          original: join(originalsDir(stage.stageDir), relative(stage.stageDir, staged)),
          movedOriginal: false,
          movedStaged: false,
        }
        swaps.add(swap)
        active.push(swap)
        swapIn(swap)
      }

      return await run()
    } finally {
      for (const swap of active.reverse()) {
        swapOut(swap)
        swaps.delete(swap)
      }
    }
  }

  const stageConfig = (config: Config): StagedConfig => {
    // A config without `storage` gets the fs storage from core.
    if (config.storage && config.storage.name !== 'fs') {
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: `--check compares files on disk, but this config uses the "${config.storage.name}" storage.`,
        help: 'Run --check on a config that uses the default fs storage.',
      })
    }
    const root = resolve(config.root ?? '')
    const outputInRoot = relativeToRoot({ root, absolute: resolve(root, config.output.path), option: 'output.path' })
    const sharedInRoot = config.shared && relativeToRoot({ root, absolute: resolve(root, config.shared.path), option: 'shared.path' })
    const stageDir = stageDirs.get(root) ?? mkdtempSync(join(root, '.kubb-check-'))
    stageDirs.set(root, stageDir)
    const shared = config.shared && sharedInRoot ? { ...config.shared, path: join(stageDir, sharedInRoot) } : config.shared

    return {
      ...config,
      [stageKey]: { userConfig: config, root, stageDir },
      storage: stagedStorage({ root, stageDir }),
      shared,
      // The passes run through `processOutput`, so core keeps no output manifest for the temporary folder.
      output: { ...config.output, path: join(stageDir, outputInRoot), clean: false, format: false, lint: false, postGenerate: [] },
    }
  }

  return {
    stage: (configs) => configs.map(stageConfig),
    patches,
    cleanup,
    userConfig: (config) => stageOf(config).userConfig,
    get changed() {
      return changed
    },
    async processOutput({ config, outputPath, ...options }) {
      const stage = stageOf(config)
      const { output, shared } = stage.userConfig
      if (output.postGenerate?.length) {
        await options.hooks.callHook('kubb:warn', { message: 'Skipped output.postGenerate because --check leaves output.path as it is.' })
      }
      if (!output.format && !output.lint) return []

      const sharedPath = config.shared && resolve(config.root, config.shared.path)
      const staged = [...new Set(sharedPath ? [outputPath, sharedPath] : [outputPath])]

      return withRealPaths({
        stage,
        folders: staged.filter((folder) => !staged.some((other) => other !== folder && isPathInside(folder, other))),
        run: () =>
          runOutputPasses({
            ...options,
            outputPath: toDiskPath(stage, outputPath),
            config: { ...config, shared, output: { ...config.output, format: output.format, lint: output.lint } },
          }),
      })
    },
    async compare({ config, storage, paths }) {
      const stage = stageOf(config)
      const { userConfig, root } = stage
      // Keyed by the real path: a plugin can name a file by its staged path or by its real one, and the storage stages either.
      const generated = new Set<string>()
      const stale: Array<StaleFile> = []
      let unchanged = 0

      // One pass: each file is read from both sides, compared and dropped, so only the stale ones stay in memory.
      // No manifest: both sides went through the same output passes, so the bytes compare directly.
      await inParallel({
        items: [...paths],
        limit: 50,
        run: async (filePath) => {
          const diskPath = toDiskPath(stage, filePath)
          generated.add(diskPath)
          const [after, before] = await Promise.all([storage.readItem(diskPath), read(diskPath).catch(() => null)])
          if (after === null) return
          const change = diffFile({ path: diskPath, next: after, previous: before })
          if (!change) {
            unchanged++
            return
          }
          stale.push(toStaleFile({ change, root, texts: diff ? { before: before ?? '', after } : undefined }))
        },
      })
      if (userConfig.output.clean) await addDeletedFiles({ stage, generated, diff, stale })

      stale.sort((a, b) => a.file.path.localeCompare(b.file.path))
      const files: Array<CheckedFile> = []
      for (const { file, patch } of stale) {
        files.push(file)
        if (patch) patches.push(patch)
      }
      changed ||= files.length > 0

      return { changed: files.length > 0, files, unchanged }
    },
  }
}
