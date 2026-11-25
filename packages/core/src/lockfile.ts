import { hash } from 'node:crypto'
import { relative, resolve } from 'node:path'
import { inParallel, readIfExists, toPosixPath, writeRaw } from '@internals/utils'
import type { Storage } from './createStorage.ts'
import { FILE_CONCURRENCY } from './FileManager.ts'
import type { LockfileInputs } from './lockfileInputs.ts'

/** Bumped when the stored shape changes, so an older lock file is discarded instead of misread. */
const LOCKFILE_VERSION = 1

/** Name of the lock file, written to the project root and meant to be committed. */
export const LOCKFILE_NAME = 'kubb.lock'

/**
 * How one generated file looked on either side of the output passes.
 */
type LockfileEntry = {
  /**
   * Hash of the content Kubb handed to the storage.
   */
  source: string
  /**
   * Hash of what the storage held once the output passes were done with it.
   */
  output: string
}

type LockfileObject = {
  lockfileVersion: number
  /** What each config last generated from, keyed by the config's name. */
  inputs?: Record<string, LockfileInputs>
  files: Record<string, LockfileEntry>
}

/**
 * Remembers what the output passes did to each generated file, so a later run can tell "the
 * formatter already turned this exact source into what is stored" apart from a real change.
 * Without it the storage compares Kubb's bytes against the formatter's, never matches, and
 * rewrites the whole output tree on every build. The record lives in `kubb.lock`, so a fresh
 * checkout can answer the same question without running the formatter.
 */
export type Lockfile = {
  /** `false` when no `kubb.lock` could be read, so nothing a formatter changed can be recognized. */
  readonly exists: boolean
  /**
   * `true` when `source` is known to come out of the output passes as exactly the content stored,
   * meaning the write can be skipped.
   */
  isUpToDate(options: { key: string; source: string; disk: string }): boolean
  /**
   * Records the source Kubb generated for `key`, so `commit` adds the file to the lock file.
   */
  track(options: { key: string; source: string }): void
  /** `true` when every tracked file was up to date, so the output passes have nothing new to run over. */
  readonly allFilesUpToDate: boolean
  /** What the config called `name` last generated from, when the lock file recorded it. */
  inputs(name: string): LockfileInputs | undefined
  /**
   * Whether every file in the lock file still holds its recorded output. With `cleanDir`, that
   * folder must also hold no file the lock file does not list.
   */
  matchesOutput(options?: { cleanDir?: string }): Promise<boolean>
  /**
   * Re-reads the files generated this run and writes `kubb.lock` with one entry for each. An entry
   * from an earlier run stays while its file still holds the recorded output, so a run that
   * generates a different set of files keeps what another config recorded. `inputs` records what
   * the config called `name` generated from, and drops that record when it is `null`.
   */
  write(options?: { name: string; inputs: LockfileInputs | null }): Promise<void>
}

/** Line endings are normalized, so a checkout that converts them still matches the lock file. */
const digest = (text: string): string => hash('sha256', text.replaceAll('\r\n', '\n'))

const isEntry = (value: unknown): value is LockfileEntry =>
  typeof value === 'object' && value !== null && typeof (value as LockfileEntry).source === 'string' && typeof (value as LockfileEntry).output === 'string'

async function readLockfileObject(lockPath: string): Promise<Pick<LockfileObject, 'files' | 'inputs'> | null> {
  try {
    const stored = await readIfExists(lockPath)
    if (stored === null) return null

    const data = JSON.parse(stored) as LockfileObject
    if (data.lockfileVersion !== LOCKFILE_VERSION) return null
    if (typeof data.files !== 'object' || data.files === null || Array.isArray(data.files)) return null

    const inputs = typeof data.inputs === 'object' && data.inputs !== null ? data.inputs : {}

    return { files: Object.fromEntries(Object.entries(data.files).filter(([, entry]) => isEntry(entry))), inputs }
  } catch {
    return null
  }
}

/**
 * Loads `kubb.lock` from `root`, starting empty when it is missing, unreadable, or from an older
 * version. `storage` holds the generated files.
 *
 * @example
 * ```ts
 * const lockfile = await createLockfile({ storage: config.storage, root: config.root })
 * ```
 */
export async function createLockfile({ storage, root }: { storage: Storage; root: string }): Promise<Lockfile> {
  const lockPath = resolve(root, LOCKFILE_NAME)
  const loaded = await readLockfileObject(lockPath)
  const entries = loaded?.files ?? {}
  const upToDateKeys = new Set<string>()
  const toLockKey = (key: string): string => toPosixPath(relative(root, resolve(root, key)))
  const tracked = new Map<string, string>()

  return {
    exists: loaded !== null,
    isUpToDate({ key, source, disk }) {
      const entry = entries[toLockKey(key)]
      if (!entry || entry.source !== digest(source) || entry.output !== digest(disk)) return false
      upToDateKeys.add(key)

      return true
    },
    get allFilesUpToDate() {
      return [...tracked.keys()].every((key) => upToDateKeys.has(key))
    },
    inputs: (name) => loaded?.inputs?.[name],
    async matchesOutput({ cleanDir } = {}) {
      const stale = new Set<string>()
      await inParallel({
        items: Object.entries(entries),
        limit: FILE_CONCURRENCY,
        run: async ([key, entry]) => {
          const stored = await storage.readItem(resolve(root, key))
          if (stored === null || digest(stored) !== entry.output) stale.add(key)
        },
      })
      if (stale.size) return false
      if (!cleanDir) return true

      return (await storage.readKeys(cleanDir)).every((name) => Object.hasOwn(entries, toLockKey(resolve(cleanDir, name))))
    },
    track({ key, source }) {
      tracked.set(key, digest(source))
    },
    async write(options) {
      try {
        const next: Record<string, LockfileEntry> = {}
        const written = new Set([...tracked.keys()].map(toLockKey))

        await inParallel({
          items: Object.entries(entries).filter(([key]) => !written.has(key)),
          limit: FILE_CONCURRENCY,
          run: async ([key, entry]) => {
            const stored = await storage.readItem(resolve(root, key))
            if (stored !== null && digest(stored) === entry.output) next[key] = entry
          },
        })
        // Reads the tree back through the same pool that wrote it, rather than one file at a time.
        await inParallel({
          items: [...tracked],
          limit: FILE_CONCURRENCY,
          run: async ([key, source]) => {
            const stored = await storage.readItem(key)
            if (stored !== null) next[toLockKey(key)] = { source, output: digest(stored) }
          },
        })

        // Sorted by path, so the file reads the same whatever order the files were written in.
        const files = Object.fromEntries(
          Object.keys(next)
            .sort()
            .map((key) => [key, next[key]!]),
        )
        const inputs = { ...loaded?.inputs }
        if (options?.inputs) inputs[options.name] = options.inputs
        else if (options) delete inputs[options.name]
        const object: LockfileObject = { lockfileVersion: LOCKFILE_VERSION, ...(Object.keys(inputs).length > 0 && { inputs }), files }
        const content = `${JSON.stringify(object, null, 2)}\n`
        if (content !== (await readIfExists(lockPath))) await writeRaw(lockPath, content)
      } catch {
        /* the record is an optimization, so a storage failure here must not fail a finished build */
      }
    },
  }
}
