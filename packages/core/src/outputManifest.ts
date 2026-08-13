import { createHash } from 'node:crypto'
import type { Storage } from './createStorage.ts'

/**
 * Bumped when the stored shape changes, so an older cache is discarded instead of misread.
 */
const VERSION = 1

/**
 * How one generated file looked on either side of the output passes.
 */
export type OutputManifestEntry = {
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
   * Whether anything was recorded for `key`, so a caller can skip reading the file when there is
   * nothing to compare it against.
   */
  has(options: { key: string }): boolean
  /**
   * `true` when `source` is known to come out of the output passes as exactly the content stored,
   * meaning the write can be skipped.
   */
  isUpToDate(options: { key: string; source: string; disk: string }): boolean
  /**
   * Records the source Kubb produced for `key` this run, whether or not it was written.
   */
  track(options: { key: string; source: string }): void
  /**
   * Re-reads every tracked file and persists the source/output pairs on top of what is stored.
   * Nothing is pruned: a run generating a different set of files, or writing to a different storage
   * in the same root, must not evict what another run recorded.
   */
  commit(): Promise<void>
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

const MANIFEST_KEY = 'output-manifest.json'

async function loadEntries({ cache }: { cache: Storage }): Promise<Record<string, OutputManifestEntry>> {
  try {
    const stored = await cache.readItem(MANIFEST_KEY)
    if (stored === null) return {}

    const data = JSON.parse(stored) as ManifestData
    if (data.version !== VERSION) return {}
    if (typeof data.entries !== 'object' || data.entries === null || Array.isArray(data.entries)) return {}

    return data.entries
  } catch {
    return {}
  }
}

/**
 * Loads the stored manifest, starting empty when it is missing, unreadable, or from an older
 * version. `storage` holds the generated files, `cache` holds the manifest itself.
 *
 * @example
 * ```ts
 * const manifest = await createOutputManifest({ storage: config.storage, cache: cacheStorage({ root: config.root }) })
 * ```
 */
export async function createOutputManifest({ storage, cache }: { storage: Storage; cache: Storage }): Promise<OutputManifest> {
  const entries = await loadEntries({ cache })
  const tracked = new Map<string, string>()

  return {
    has({ key }) {
      return entries[key] !== undefined
    },
    isUpToDate({ key, source, disk }) {
      const entry = entries[key]
      if (!entry) return false

      return entry.source === hash(source) && entry.output === hash(disk)
    },
    track({ key, source }) {
      tracked.set(key, hash(source))
    },
    async commit() {
      try {
        const next = { ...entries }

        for (const [key, source] of tracked) {
          const stored = await storage.readItem(key)
          if (stored === null) continue

          next[key] = { source, output: hash(stored) }
        }

        await cache.writeItem(MANIFEST_KEY, JSON.stringify({ version: VERSION, entries: next } satisfies ManifestData))
      } catch {
        /* the record is an optimization, so a storage failure here must not fail a finished build */
      }
    },
  }
}
