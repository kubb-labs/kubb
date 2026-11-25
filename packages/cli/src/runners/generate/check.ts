import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { diffHunks, read, toPosixPath } from '@internals/utils'
import { type Config, Diagnostics, fsStorage, type GenerateOptions, type GenerationResult, runOutputPasses, type Storage } from '@kubb/core'
import { diffOutput, type FileChange, readOutputFiles } from './utils.ts'

type CheckedFile = NonNullable<GenerationResult['files']>[number]

const statusNames = { A: 'added', M: 'modified', D: 'deleted' } as const

/**
 * What `kubb generate --check` needs for one run: the configs redirected to a temporary folder, the
 * output passes for that folder, and the comparison with the files on disk.
 */
export type Check = {
  configs: Array<Config>
  processOutput: NonNullable<GenerateOptions['processOutput']>
  /**
   * The config as the user wrote it, for a config from `configs`.
   */
  original(config: Config): Config
  /**
   * Compares what one config generated with its real output folder.
   */
  compare(options: { config: Config; storage: Storage; paths: ReadonlySet<string> }): Promise<{ files: Array<CheckedFile>; unchanged: number }>
  /**
   * `true` once any config's output differs from the files on disk.
   */
  readonly changed: boolean
  /**
   * One unified diff per changed file, filled only with `diff`.
   */
  diffs: Array<string>
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
 * Sets up a check run. Each config generates into `<root>/.kubb-check-<id>/<output.path>` with the fs
 * storage, so formatters and linters find the project's config files and `output.path` is never written.
 * The folder is not under `node_modules`, which prettier, oxfmt and eslint skip.
 *
 * `output.postGenerate` does not run: its commands name their own paths and would write to the real output.
 */
export function createCheck({ configs, diff }: { configs: ReadonlyArray<Config>; diff: boolean }): Check {
  const id = randomUUID().slice(0, 8)
  const targets = new Map<string, Target>()
  const dirs = new Set<string>()
  const diffs: Array<string> = []
  let changed = false

  const cleanup = () => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
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
    const dir = join(root, `.kubb-check-${id}`)
    const outputPath = join(dir, pathInRoot({ root, absolute: resolve(root, config.output.path), option: 'output.path' }))
    const shared = config.shared && {
      ...config.shared,
      path: join(dir, pathInRoot({ root, absolute: resolve(root, config.shared.path), option: 'shared.path' })),
    }
    dirs.add(dir)
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
    diffs,
    cleanup,
    original: (config) => targetOf(config).config,
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
      const { config: original, dir } = targetOf(config)
      const root = resolve(original.root)
      const toReal = (filePath: string) => join(root, relative(dir, filePath))

      // Keyed by the temporary path, so each file lines up with what was generated for it.
      const previousFiles = new Map<string, string>()
      for (const [filePath, source] of await readOutputFiles(resolve(root, original.output.path))) {
        previousFiles.set(join(dir, relative(root, filePath)), source)
      }
      // Generated files outside `output.path`, such as `shared.path`.
      for (const filePath of paths) {
        if (previousFiles.has(filePath)) continue
        const source = await read(toReal(filePath)).catch(() => null)
        if (source !== null) previousFiles.set(filePath, source)
      }

      // No manifest: both sides went through the same output passes, so the bytes compare directly.
      const result = await diffOutput({ storage, paths, clean: Boolean(original.output.clean), previousFiles })
      const files: Array<CheckedFile> = []
      for (const change of result.files.toSorted((a: FileChange, b: FileChange) => a.path.localeCompare(b.path))) {
        const path = toPosixPath(relative(root, toReal(change.path)))
        files.push({ path, status: statusNames[change.status], added: change.added ?? 0, removed: change.removed ?? 0 })
        if (!diff) continue
        const after = change.status === 'D' ? '' : ((await storage.readItem(change.path)) ?? '')
        diffs.push(formatPatch({ path, before: previousFiles.get(change.path) ?? '', after }))
      }
      changed ||= files.length > 0

      return { files, unchanged: result.unchanged }
    },
  }
}
