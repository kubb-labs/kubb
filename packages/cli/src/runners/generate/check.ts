import { mkdtempSync, rmSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { diffHunks, read, toPosixPath } from '@internals/utils'
import { type Config, Diagnostics, fsStorage, type GenerateOptions, type GenerationResult, runOutputPasses, type Storage } from '@kubb/core'
import { diffOutput, readOutputFiles, statusKeys } from './utils.ts'

type CheckResult = NonNullable<GenerationResult['check']>

/**
 * What `kubb generate --check` needs for one run: the configs redirected to a temporary folder, the
 * output passes for that folder, and the comparison with the files on disk.
 */
export type OutputCheck = {
  configs: Array<Config>
  processOutput: NonNullable<GenerateOptions['processOutput']>
  /**
   * The config as the user wrote it, for a config from `configs`.
   */
  userConfig(config: Config): Config
  /**
   * Compares what one config generated with its real output folder.
   */
  compare(options: { config: Config; storage: Storage; paths: ReadonlySet<string> }): Promise<CheckResult & { unchanged: number }>
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

type Target = { config: Config; dir: string }

/** The path of `absolute` below `root`. Throws when it sits outside, since the temporary folder mirrors the project root. */
function pathInRoot({ root, absolute, option }: { root: string; absolute: string; option: string }): string {
  const path = relative(root, absolute)
  if (path && !path.startsWith('..') && !isAbsolute(path)) return path

  throw new Diagnostics.Error({
    code: Diagnostics.code.unknown,
    severity: 'error',
    message: `--check cannot compare \`${option}\` "${absolute}" because it is not a folder inside the project root.`,
    help: `Point \`${option}\` at a folder inside \`root\`, such as \`./src/gen\`.`,
  })
}

function formatPatch({ path, before, after }: { path: string; before: string; after: string }): string {
  const { hunks } = diffHunks(before, after)

  return [
    `--- a/${path}`,
    `+++ b/${path}`,
    ...hunks.flatMap((hunk) => [`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`, ...hunk.lines]),
  ].join('\n')
}

/**
 * Sets up a check run. Each config generates into `<root>/.kubb-check-<random>/<output.path>` with the fs
 * storage, so formatters and linters find the project's config files and `output.path` is never written.
 * The folder is not under `node_modules`, which prettier, oxfmt and eslint skip.
 *
 * `output.postGenerate` does not run: its commands name their own paths and would write to the real output.
 */
export function createOutputCheck({ configs, diff }: { configs: ReadonlyArray<Config>; diff: boolean }): OutputCheck {
  const targets = new Map<string, Target>()
  // One temporary folder per project root.
  const dirs = new Map<string, string>()
  const patches: Array<string> = []
  let changed = false

  const cleanup = () => {
    for (const dir of dirs.values()) rmSync(dir, { recursive: true, force: true })
  }
  // A backstop for `process.exit()`, which skips every `finally`.
  process.once('exit', cleanup)

  const runConfigs = configs.map((config) => {
    if (config.storage?.name !== 'fs') {
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: `--check compares files on disk, but this config uses the "${config.storage?.name}" storage.`,
        help: 'Run --check on a config that uses the default fs storage.',
      })
    }
    const root = resolve(config.root)
    const output = pathInRoot({ root, absolute: resolve(root, config.output.path), option: 'output.path' })
    const sharedPath = config.shared && pathInRoot({ root, absolute: resolve(root, config.shared.path), option: 'shared.path' })
    const dir = dirs.get(root) ?? mkdtempSync(join(root, '.kubb-check-'))
    dirs.set(root, dir)
    const outputPath = join(dir, output)
    const shared = config.shared && sharedPath ? { ...config.shared, path: join(dir, sharedPath) } : config.shared
    targets.set(outputPath, { config, dir })

    return {
      ...config,
      storage: fsStorage(),
      shared,
      // The passes run through `processOutput`, so core keeps no output manifest for the temporary folder.
      output: { ...config.output, path: outputPath, clean: false, format: false, lint: false, postGenerate: [] },
    } satisfies Config
  })

  const targetOf = (config: Config): Target => targets.get(resolve(config.root, config.output.path))!

  return {
    configs: runConfigs,
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
      const { config: userConfig, dir } = targetOf(config)
      const root = resolve(userConfig.root)
      const toReal = (filePath: string) => join(root, relative(dir, filePath))

      // Keyed by the temporary path, so each file lines up with what was generated for it.
      const previousFiles = new Map<string, string>()
      for (const [filePath, source] of await readOutputFiles(resolve(root, userConfig.output.path))) {
        previousFiles.set(join(dir, relative(root, filePath)), source)
      }
      // Generated files outside `output.path`, such as `shared.path`.
      for (const filePath of paths) {
        if (previousFiles.has(filePath)) continue
        const source = await read(toReal(filePath)).catch(() => null)
        if (source !== null) previousFiles.set(filePath, source)
      }

      // No manifest: both sides went through the same output passes, so the bytes compare directly.
      const result = await diffOutput({ storage, paths, clean: Boolean(userConfig.output.clean), previousFiles })
      const files: CheckResult['files'] = []
      for (const change of result.files.toSorted((a, b) => a.path.localeCompare(b.path))) {
        const path = toPosixPath(relative(root, toReal(change.path)))
        files.push({ path, status: statusKeys[change.status], linesAdded: change.added ?? 0, linesRemoved: change.removed ?? 0 })
        if (!diff) continue
        const after = change.status === 'D' ? '' : ((await storage.readItem(change.path)) ?? '')
        patches.push(formatPatch({ path, before: previousFiles.get(change.path) ?? '', after }))
      }
      changed ||= files.length > 0

      return { changed: files.length > 0, files, unchanged: result.unchanged }
    },
  }
}
