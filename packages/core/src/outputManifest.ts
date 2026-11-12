import { hash } from 'node:crypto'
import { inParallel } from '@internals/utils'
import type { Storage } from './createStorage.ts'
import { FILE_CONCURRENCY } from './FileManager.ts'

/**
 * Bumped when the stored shape changes, so an older cache is discarded instead of misread.
 */
const VERSION = 1

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

type ManifestData = {
  version: number
  /**
   * The `passes` of the run that wrote the entries. Missing in a manifest from before it existed.
   */
  passes?: string
  entries: Record<string, OutputManifestEntry>
}

/**
 * Remembers what the output passes did to each generated file, so the next run can tell "the
 * formatter already turned this exact source into what is stored" apart from a real change.
 * Without it the storage compares Kubb's bytes against the formatter's, never matches, and
 * rewrites the whole output tree on every build.
 */
export type OutputManifest = {
  /**
   * `true` when `source` is known to come out of the output passes as exactly the content stored,
   * meaning the write can be skipped.
   */
  isUpToDate(options: { key: string; source: string; disk: string }): boolean
  /**
   * Records the source Kubb wrote for `key`, or left on disk without a record of the output passes
   * having seen it, marking it as a file the passes have to run over and `commit` has to re-read.
   */
  track(options: { key: string; source: string }): void
  /**
   * The tracked keys, the only files the output passes have to run over this run. `null` when they
   * have to run over the whole output: the stored entries are missing or came from other `passes`.
   */
  pending(): Array<string> | null
  /**
   * Re-reads the files written this run and persists their source/output pairs on top of what is
   * stored. Nothing is pruned: a run generating a different set of files, or writing to a different
   * storage in the same root, must not evict what another run recorded.
   */
  commit(): Promise<void>
}

const MANIFEST_KEY = 'output-manifest.json'

async function loadData({ cache }: { cache: Storage }): Promise<Omit<ManifestData, 'version'>> {
  try {
    const stored = await cache.readItem(MANIFEST_KEY)
    if (stored === null) return { entries: {} }

    const data = JSON.parse(stored) as ManifestData
    if (data.version !== VERSION) return { entries: {} }
    if (typeof data.entries !== 'object' || data.entries === null || Array.isArray(data.entries)) return { entries: {} }

    return { passes: data.passes, entries: data.entries }
  } catch {
    return { entries: {} }
  }
}

type CreateOutputManifestOptions = {
  /**
   * Holds the generated files.
   */
  storage: Storage
  /**
   * Holds the manifest itself.
   */
  cache: Storage
  /**
   * Identifies the output pass settings. Entries recorded under other settings say nothing about
   * what these passes make of a file, so `pending` returns `null` until a run under them commits.
   */
  passes?: string
}

/**
 * Loads the stored manifest, starting empty when it is missing, unreadable, or from an older
 * version.
 *
 * @example
 * ```ts
 * const manifest = await createOutputManifest({ storage: config.storage, cache: cacheStorage({ root: config.root }), passes: 'prettier' })
 * ```
 */
export async function createOutputManifest({ storage, cache, passes = '' }: CreateOutputManifestOptions): Promise<OutputManifest> {
  const data = await loadData({ cache })
  const entries = data.entries
  const tracked = new Map<string, string>()

  return {
    isUpToDate({ key, source, disk }) {
      const entry = entries[key]
      if (!entry) return false

      return entry.source === hash('sha256', source) && entry.output === hash('sha256', disk)
    },
    track({ key, source }) {
      tracked.set(key, hash('sha256', source))
    },
    pending() {
      if (data.passes !== passes) return null

      return [...tracked.keys()]
    },
    async commit() {
      try {
        const next = { ...entries }

        // Reads the tree back through the same pool that wrote it, rather than one file at a time.
        await inParallel({
          items: [...tracked],
          limit: FILE_CONCURRENCY,
          run: async ([key, source]) => {
            const stored = await storage.readItem(key)
            if (stored === null) return

            next[key] = { source, output: hash('sha256', stored) }
          },
        })

        await cache.writeItem(MANIFEST_KEY, JSON.stringify({ version: VERSION, passes, entries: next } satisfies ManifestData))
      } catch {
        /* the record is an optimization, so a storage failure here must not fail a finished build */
      }
    },
  }
}
