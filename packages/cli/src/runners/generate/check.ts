import { join, relative, resolve } from 'node:path'
import { diffHunks, inParallel, listFiles, read, toPosixPath } from '@internals/utils'
import { type Config, createLockfile, Diagnostics, fsStorage, type GenerationResult, hasOutputPasses, memoryStorage, type Storage } from '@kubb/core'
import { formatPatch } from 'diff'
import { diffFile, type FileChange, fingerprintFile, statusKeys } from './utils.ts'

type Origin = { config: Config; root: string }

// Core copies a symbol key when it resolves the config, so the origin survives.
const originKey = Symbol('kubb.check.origin')
type CheckConfig = Config & { [originKey]?: Origin }
const originOf = (config: Config): Origin => (config as CheckConfig)[originKey]!

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
  origin,
  generated,
  diff,
  stale,
}: {
  origin: Origin
  generated: ReadonlySet<string>
  diff: boolean
  stale: Array<StaleFile>
}): Promise<void> {
  const outputPath = resolve(origin.root, origin.config.output.path)
  for await (const name of listFiles(outputPath)) {
    const filePath = join(outputPath, name)
    if (generated.has(filePath)) continue
    const source = await read(filePath).catch(() => null)
    if (source === null) continue
    const change = { status: 'D', path: filePath, added: 0, removed: fingerprintFile(source).deletedLines } as const
    stale.push(toStaleFile({ change, root: origin.root, texts: diff ? { before: source, after: '' } : undefined }))
  }
}

/**
 * One `kubb generate --check` run. Each config generates into memory and no formatter or linter runs.
 *
 * A generated file is up to date when the file on disk holds the same text, or when `kubb-lock.yaml`
 * records that this exact source came out of the output passes as the text on disk. `kubb generate`
 * writes that record, so the check gives the same answer on a fresh checkout.
 */
export class OutputCheck {
  /**
   * One unified diff per changed file, filled only with `diff`.
   */
  readonly patches: Array<string> = []
  readonly #diff: boolean
  #changed = false
  #missingLockfile = false

  constructor({ diff }: { diff: boolean }) {
    this.#diff = diff
  }

  get changed(): boolean {
    return this.#changed
  }

  /**
   * `true` once a config that formats or lints its output has no `kubb-lock.yaml` to compare with.
   */
  get missingLockfile(): boolean {
    return this.#missingLockfile
  }

  /**
   * The configs to generate instead: each keeps its files in memory. Throws for a config a check cannot compare.
   */
  prepare(configs: ReadonlyArray<Config>): Array<Config> {
    return configs.map((config): CheckConfig => {
      // A config without `storage` gets the fs storage from core.
      if (config.storage && config.storage.name !== 'fs') {
        throw new Diagnostics.Error({
          code: Diagnostics.code.unknown,
          severity: 'error',
          message: `--check compares files on disk, but this config uses the "${config.storage.name}" storage.`,
          help: 'Run --check on a config that uses the default fs storage.',
        })
      }

      return {
        ...config,
        [originKey]: { config, root: resolve(config.root ?? '') },
        storage: memoryStorage(),
        // Nothing is on disk for the passes to run over. The lockfile stands in for them.
        output: { ...config.output, format: false, lint: false, postGenerate: [] },
      }
    })
  }

  /**
   * The config as the user wrote it, for a config from `prepare`.
   */
  original(config: Config): Config {
    return originOf(config).config
  }

  async compare({
    config,
    storage,
    paths,
  }: {
    config: Config
    storage: Storage
    paths: ReadonlySet<string>
  }): Promise<NonNullable<GenerationResult['check']> & { unchanged: number }> {
    const origin = originOf(config)
    const diff = this.#diff
    const disk = fsStorage()
    const lockfile = await createLockfile({ storage: disk, root: origin.root })
    this.#missingLockfile ||= !lockfile.exists && hasOutputPasses({ output: origin.config.output, storage: disk })
    const stale: Array<StaleFile> = []
    let unchanged = 0

    // One pass: each file is read from both sides, compared and dropped, so only the stale ones stay in memory.
    await inParallel({
      items: [...paths],
      limit: 50,
      run: async (filePath) => {
        const [after, before] = await Promise.all([storage.readItem(filePath), read(filePath).catch(() => null)])
        if (after === null) return
        const change = diffFile({ path: filePath, next: after, previous: before, lockfile })
        if (!change) {
          unchanged++
          return
        }
        stale.push(toStaleFile({ change, root: origin.root, texts: diff ? { before: before ?? '', after } : undefined }))
      },
    })
    if (origin.config.output.clean) await addDeletedFiles({ origin, generated: paths, diff, stale })

    stale.sort((a, b) => a.file.path.localeCompare(b.file.path))
    const files: Array<CheckedFile> = []
    for (const { file, patch } of stale) {
      files.push(file)
      if (patch) this.patches.push(patch)
    }
    this.#changed ||= files.length > 0

    return { changed: files.length > 0, files, unchanged }
  }
}

export function createOutputCheck(options: { diff: boolean }): OutputCheck {
  return new OutputCheck(options)
}
