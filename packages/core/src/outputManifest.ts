import { hash } from 'node:crypto'
import { relative, resolve } from 'node:path'
import { inParallel, readIfExists, toPosixPath, writeRaw } from '@internals/utils'
import type { Storage } from './createStorage.ts'
import { FILE_CONCURRENCY } from './FileManager.ts'

/** Bumped when the stored shape changes, so an older lock file is discarded instead of misread. */
const LOCKFILE_VERSION = 1

/** Name of the lock file, written to the project root and meant to be committed. */
export const LOCKFILE_NAME = 'kubb.lock'

/**
 * How one generated file looked on either side of the output passes.
 */
type OutputManifestEntry = {
  /**
   * Hash of the content Kubb handed to the storage.
   */
  source: string
  /**
   * Hash of what the storage held once the output passes were done with it.
   */
  output: string
}

type Lockfile = {
  lockfileVersion: number
  files: Record<string, OutputManifestEntry>
}

/**
 * Remembers what the output passes did to each generated file, so a later run can tell "the
 * formatter already turned this exact source into what is stored" apart from a real change.
 * Without it the storage compares Kubb's bytes against the formatter's, never matches, and
 * rewrites the whole output tree on every build. The record lives in `kubb.lock`, so a fresh
 * checkout can answer the same question without running the formatter.
 */
export type OutputManifest = {
  /** `false` when no `kubb.lock` could be read, so nothing a formatter changed can be recognized. */
  readonly exists: boolean
  /**
   * `true` when `source` is known to come out of the output passes as exactly the content stored,
   * meaning the write can be skipped.
   */
  isUpToDate(options: { key: string; source: string; disk: string }): boolean
  /**
   * Records the source Kubb wrote for `key`, marking it as the only kind of file the output passes
   * can have changed and so the only kind `commit` has to re-read.
   */
  track(options: { key: string; source: string }): void
  /**
   * Re-reads the files written this run and writes `kubb.lock`. An entry from an earlier run stays
   * while its file still holds the recorded output, so a run that generates a different set of
   * files keeps what another config recorded. A file the output passes left as written gets no entry.
   */
  commit(): Promise<void>
}

/** Line endings are normalized, so a checkout that converts them still matches the lock file. */
const digest = (text: string): string => hash('sha256', text.replaceAll('\r\n', '\n'))

const isEntry = (value: unknown): value is OutputManifestEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as OutputManifestEntry).source === 'string' &&
  typeof (value as OutputManifestEntry).output === 'string'

async function loadEntries(lockPath: string): Promise<Record<string, OutputManifestEntry> | null> {
  try {
    const stored = await readIfExists(lockPath)
    if (stored === null) return null

    const data = JSON.parse(stored) as Lockfile
    if (data.lockfileVersion !== LOCKFILE_VERSION) return null
    if (typeof data.files !== 'object' || data.files === null || Array.isArray(data.files)) return null

    return Object.fromEntries(Object.entries(data.files).filter(([, entry]) => isEntry(entry)))
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
 * const manifest = await createOutputManifest({ storage: config.storage, root: config.root })
 * ```
 */
export async function createOutputManifest({ storage, root }: { storage: Storage; root: string }): Promise<OutputManifest> {
  const lockPath = resolve(root, LOCKFILE_NAME)
  const loaded = await loadEntries(lockPath)
  const entries = loaded ?? {}
  const toLockKey = (key: string): string => toPosixPath(relative(root, resolve(root, key)))
  const tracked = new Map<string, { source: string; trimmed: string }>()

  return {
    exists: loaded !== null,
    isUpToDate({ key, source, disk }) {
      const entry = entries[toLockKey(key)]
      if (!entry) return false

      return entry.source === digest(source) && entry.output === digest(disk)
    },
    track({ key, source }) {
      tracked.set(key, { source: digest(source), trimmed: digest(source.trim()) })
    },
    async commit() {
      try {
        const next: Record<string, OutputManifestEntry> = {}
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
          run: async ([key, { source, trimmed }]) => {
            const stored = await storage.readItem(key)
            // The storage trims what it writes, so an untouched file equals the trimmed source.
            if (stored === null || digest(stored.trim()) === trimmed) return
            next[toLockKey(key)] = { source, output: digest(stored) }
          },
        })

        // Sorted by path, so the file reads the same whatever order the files were written in.
        const files = Object.fromEntries(
          Object.keys(next)
            .sort()
            .map((key) => [key, next[key]!]),
        )
        const content = `${JSON.stringify({ lockfileVersion: LOCKFILE_VERSION, files } satisfies Lockfile, null, 2)}\n`
        if (content !== (await readIfExists(lockPath))) await writeRaw(lockPath, content)
      } catch {
        /* the record is an optimization, so a storage failure here must not fail a finished build */
      }
    },
  }
}
