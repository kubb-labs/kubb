import { createHash } from 'node:crypto'
import type { Storage } from './createStorage.ts'

/**
 * Bumped whenever the stored shape changes, so an older cache is discarded instead of misread.
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
   * Hash of what the storage held once the formatter, linter, and `postGenerate` were done with it.
   */
  output: string
}

type ManifestData = {
  version: number
  entries: Record<string, OutputManifestEntry>
}

/**
 * Remembers what the output passes did to each generated file, so the next run can tell
 * "the formatter already turned this exact source into what is stored" apart from a real change.
 *
 * The storage skips a write when the content it is about to write already matches the file. That
 * check can never match on its own once a formatter has run, because the stored bytes are the
 * formatter's, not Kubb's, and the whole output tree is rewritten on every build.
 */
export type OutputManifest = {
  /**
   * Whether anything was recorded for `key` on an earlier run. A caller that would have to read the
   * file to call {@link OutputManifest.isUpToDate} can skip that read when this is `false`.
   */
  has(options: { key: string }): boolean
  /**
   * `true` when `source` is known to come out of the output passes as exactly the content already
   * stored, meaning the write can be skipped.
   */
  isUpToDate(options: { key: string; source: string; disk: string }): boolean
  /**
   * Records the source Kubb produced for `key` this run, whether or not it was written.
   */
  track(options: { key: string; source: string }): void
  /**
   * Re-reads every tracked file after the output passes and persists the source/output pairs on top
   * of the entries already stored. Nothing is pruned: a run that generates a different set of files,
   * or writes to a different storage in the same root, must not evict what another run recorded.
   */
  commit(): Promise<void>
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Key the manifest is stored under inside the cache storage.
 */
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
 * Loads the stored manifest, or starts empty when it is missing, unreadable, or written by an
 * older version of Kubb. `storage` holds the generated files the manifest describes, `cache` is
 * where the manifest itself lives.
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
