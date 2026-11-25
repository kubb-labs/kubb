import { mkdtempSync, rmSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { diffHunks, isPathInside, read, toPosixPath } from '@internals/utils'
import { type Config, Diagnostics, fsStorage, type GenerateOptions, type GenerationResult, runOutputPasses, type Storage } from '@kubb/core'
import { formatPatch } from 'diff'
import { diffOutput, readOutputFiles, statusKeys } from './utils.ts'

/**
 * What `kubb generate --check` needs for one run: the configs redirected to a temporary folder, the
 * output passes for that folder, and the comparison with the files on disk.
 */
export type OutputCheck = {
  /**
   * The configs to generate instead: each writes to a temporary folder. Throws for a config a check cannot compare.
   */
  redirect(configs: ReadonlyArray<Config>): Array<Config>
  processOutput: NonNullable<GenerateOptions['processOutput']>
  /**
   * The config as the user wrote it, for a config from `redirect`.
   */
  userConfig(config: Config): Config
  /**
   * Compares what one config generated with its real output folder.
   */
  compare(options: { config: Config; storage: Storage; paths: ReadonlySet<string> }): Promise<NonNullable<GenerationResult['check']> & { unchanged: number }>
  /**
   * `true` once any config's output differs from the files on disk.
   */
  readonly changed: boolean
  /**
   * One unified diff per changed file, filled only with `diff`.
   */
  patches: Array<string>
  /**
   * Deletes the temporary folders.
   */
  cleanup(): void
}

type Target = { config: Config; root: string; dir: string }

// Carried on each redirected config. Core copies it when it resolves the config, so two configs with the same output folder keep their own target.
const targetKey = Symbol('kubb.check.target')
type RedirectedConfig = Config & { [targetKey]?: Target }

const targetOf = (config: RedirectedConfig): Target => config[targetKey]!

/** The real path of a generated file: a path in the temporary folder maps back to its place under the root. */
function toDiskPath({ root, dir }: Target, filePath: string): string {
  return isPathInside(filePath, dir) ? join(root, relative(dir, filePath)) : filePath
}

/**
 * The fs storage of a check. A plugin can write next to `output.path`, so every key inside the root
 * moves into the temporary folder, and a key outside the root is refused. Nothing real is written.
 */
function stagedStorage({ root, dir }: Pick<Target, 'root' | 'dir'>): Storage {
  const fs = fsStorage()
  const stage = (key: string): string => {
    const absolute = resolve(key)
    if (isPathInside(absolute, dir)) return absolute
    if (isPathInside(absolute, root)) return join(dir, relative(root, absolute))

    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: `--check cannot generate "${absolute}" because it is outside the project root.`,
      help: 'Keep every generated file inside `root`.',
    })
  }

  return {
    name: fs.name,
    readItem: (key) => fs.readItem(stage(key)),
    writeItem: (key, value, options) => fs.writeItem(stage(key), value, options),
    removeItem: (key) => fs.removeItem(stage(key)),
    readKeys: (base) => fs.readKeys(base && stage(base)),
    empty: async (base) => (base ? fs.empty(stage(base)) : undefined),
  }
}

/** The path of `absolute` below `root`. Throws when it sits outside, since the temporary folder mirrors the project root. */
function pathInRoot({ root, absolute, option }: { root: string; absolute: string; option: string }): string {
  const path = relative(root, absolute)
  if (path && isPathInside(absolute, root)) return path

  throw new Diagnostics.Error({
    code: Diagnostics.code.unknown,
    severity: 'error',
    message: `--check cannot compare \`${option}\` "${absolute}" because it is not a folder inside the project root.`,
    help: `Point \`${option}\` at a folder inside \`root\`, such as \`./src/gen\`.`,
  })
}

/**
 * The files on disk a check compares with, keyed by their real path: the output folder, plus each generated file outside it.
 */
async function readDiskFiles({ target: { config, root }, paths }: { target: Target; paths: ReadonlySet<string> }): Promise<Map<string, string>> {
  const files = await readOutputFiles(resolve(root, config.output.path))
  // Generated files outside `output.path`, such as `shared.path` or a file a plugin writes elsewhere.
  for (const filePath of paths) {
    if (files.has(filePath)) continue
    const source = await read(filePath).catch(() => null)
    if (source !== null) files.set(filePath, source)
  }

  return files
}

/**
 * Sets up a check run. Each config generates into `<root>/.kubb-check-<random>/<output.path>` with the fs
 * storage, so formatters and linters find the project's config files and `output.path` is never written.
 * The folder is not under `node_modules`, which prettier, oxfmt and eslint skip.
 *
 * `output.postGenerate` does not run: its commands name their own paths and would write to the real output.
 */
export function createOutputCheck({ diff }: { diff: boolean }): OutputCheck {
  // One temporary folder per project root.
  const dirs = new Map<string, string>()
  const patches: Array<string> = []
  let changed = false

  const cleanup = () => {
    for (const dir of dirs.values()) rmSync(dir, { recursive: true, force: true })
  }
  // A backstop for `process.exit()`, which skips every `finally`.
  process.once('exit', cleanup)

  const redirectConfig = (config: Config): RedirectedConfig => {
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
    const output = pathInRoot({ root, absolute: resolve(root, config.output.path), option: 'output.path' })
    const sharedPath = config.shared && pathInRoot({ root, absolute: resolve(root, config.shared.path), option: 'shared.path' })
    const dir = dirs.get(root) ?? mkdtempSync(join(root, '.kubb-check-'))
    dirs.set(root, dir)
    const outputPath = join(dir, output)
    const shared = config.shared && sharedPath ? { ...config.shared, path: join(dir, sharedPath) } : config.shared

    return {
      ...config,
      [targetKey]: { config, root, dir },
      storage: stagedStorage({ root, dir }),
      shared,
      // The passes run through `processOutput`, so core keeps no output manifest for the temporary folder.
      output: { ...config.output, path: outputPath, clean: false, format: false, lint: false, postGenerate: [] },
    }
  }

  return {
    redirect: (configs) => configs.map(redirectConfig),
    patches,
    cleanup,
    userConfig: (config) => targetOf(config).config,
    get changed() {
      return changed
    },
    async processOutput({ config, ...options }) {
      const { output } = targetOf(config).config
      if (output.postGenerate?.length) {
        await options.hooks.callHook('kubb:warn', { message: 'Skipped output.postGenerate because --check never writes to output.path.' })
      }

      return runOutputPasses({ ...options, config: { ...config, output: { ...config.output, format: output.format, lint: output.lint } } })
    },
    async compare({ config, storage, paths }) {
      const target = targetOf(config)
      const { config: userConfig, root } = target
      // Both sides use the real path: a plugin can name a file by its staged path or by its real one, and the storage stages either.
      const diskPaths = new Set(Array.from(paths, (filePath) => toDiskPath(target, filePath)))
      const previousFiles = await readDiskFiles({ target, paths: diskPaths })

      // No manifest: both sides went through the same output passes, so the bytes compare directly.
      const result = await diffOutput({ storage, paths: diskPaths, clean: Boolean(userConfig.output.clean), previousFiles })
      const files: NonNullable<GenerationResult['check']>['files'] = []
      for (const change of result.files.toSorted((a, b) => a.path.localeCompare(b.path))) {
        const path = toPosixPath(relative(root, change.path))
        files.push({ path, status: statusKeys[change.status], linesAdded: change.added ?? 0, linesRemoved: change.removed ?? 0 })
        if (!diff) continue
        const after = change.status === 'D' ? '' : ((await storage.readItem(change.path)) ?? '')
        const { hunks } = diffHunks(previousFiles.get(change.path) ?? '', after)
        patches.push(formatPatch({ oldFileName: `a/${path}`, newFileName: `b/${path}`, oldHeader: undefined, newHeader: undefined, hunks }).trimEnd())
      }
      changed ||= files.length > 0

      return { changed: files.length > 0, files, unchanged: result.unchanged }
    },
  }
}
