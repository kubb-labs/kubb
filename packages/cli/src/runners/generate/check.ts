import { join, relative, resolve } from 'node:path'
import { diffHunks, inParallel, listFiles, read, toPosixPath } from '@internals/utils'
import { type Config, createOutputManifest, Diagnostics, fsStorage, type GenerationResult, hasOutputPasses, memoryStorage, type Storage } from '@kubb/core'
import { formatPatch } from 'diff'
import { diffFile, type FileChange, fingerprintFile, statusKeys } from './utils.ts'

/**
 * What `kubb generate --check` needs for one run: the configs set up to write nothing, and the
 * comparison of what they generate with the files on disk.
 */
export type OutputCheck = {
  /**
   * The configs to generate instead: each keeps its files in memory. Throws for a config a check cannot compare.
   */
  stage(configs: ReadonlyArray<Config>): Array<Config>
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
   * `true` once a config that formats or lints its output has no `kubb.lock` to compare with.
   */
  readonly missingLock: boolean
  /**
   * One unified diff per changed file, filled only with `diff`.
   */
  patches: Array<string>
}

type Stage = { userConfig: Config; root: string }

// Carried on each staged config. Core copies it when it resolves the config.
const stageKey = Symbol('kubb.check.stage')
type StagedConfig = Config & { [stageKey]?: Stage }

const stageOf = (config: StagedConfig): Stage => config[stageKey]!

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
 * Sets up a check run. Each config generates into memory and no formatter or linter runs.
 *
 * A generated file is up to date when the file on disk holds the same text, or when `kubb.lock`
 * records that this exact source came out of the output passes as the text on disk. `kubb generate`
 * writes that record, so the check gives the same answer on a fresh checkout.
 */
export function createOutputCheck({ diff }: { diff: boolean }): OutputCheck {
  const patches: Array<string> = []
  let changed = false
  let missingLock = false

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

    return {
      ...config,
      [stageKey]: { userConfig: config, root: resolve(config.root ?? '') },
      storage: memoryStorage(),
      // Nothing is on disk for the passes to run over. The lock file stands in for them.
      output: { ...config.output, format: false, lint: false, postGenerate: [] },
    }
  }

  return {
    stage: (configs) => configs.map(stageConfig),
    patches,
    userConfig: (config) => stageOf(config).userConfig,
    get changed() {
      return changed
    },
    get missingLock() {
      return missingLock
    },
    async compare({ config, storage, paths }) {
      const stage = stageOf(config)
      const { userConfig, root } = stage
      const disk = fsStorage()
      const manifest = await createOutputManifest({ storage: disk, root })
      missingLock ||= !manifest.exists && hasOutputPasses({ output: userConfig.output, storage: disk })
      const stale: Array<StaleFile> = []
      let unchanged = 0

      // One pass: each file is read from both sides, compared and dropped, so only the stale ones stay in memory.
      await inParallel({
        items: [...paths],
        limit: 50,
        run: async (filePath) => {
          const [after, before] = await Promise.all([storage.readItem(filePath), read(filePath).catch(() => null)])
          if (after === null) return
          const change = diffFile({ path: filePath, next: after, previous: before, manifest })
          if (!change) {
            unchanged++
            return
          }
          stale.push(toStaleFile({ change, root, texts: diff ? { before: before ?? '', after } : undefined }))
        },
      })
      if (userConfig.output.clean) await addDeletedFiles({ stage, generated: paths, diff, stale })

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
