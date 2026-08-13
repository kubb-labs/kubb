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
   * `true` when `source` is known to come out of the output passes as exactly the content already
   * stored, meaning the write can be skipped.
   */
  isUpToDate(options: { key: string; source: string; disk: string }): boolean
  /**
   * Records the source Kubb produced for `key` this run, whether or not it was written.
   */
  track(options: { key: string; source: string }): void
  /**
   * Re-reads every tracked file after the output passes and persists the source/output pairs.
   * Entries from earlier runs are kept while their file is still there, so a second config
   * generating into the same root does not evict the first one's, and deleted files do not
   * accumulate.
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
  const stored = await cache.readItem(MANIFEST_KEY)
  if (stored === null) return {}

  try {
    const data = JSON.parse(stored) as ManifestData
    return data.version === VERSION && data.entries ? data.entries : {}
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
    isUpToDate({ key, source, disk }) {
      const entry = entries[key]
      if (!entry) return false

      return entry.source === hash(source) && entry.output === hash(disk)
    },
    track({ key, source }) {
      tracked.set(key, hash(source))
    },
    async commit() {
      const next: Record<string, OutputManifestEntry> = {}

      for (const [key, entry] of Object.entries(entries)) {
        if (tracked.has(key)) continue
        if (await storage.existsItem(key)) next[key] = entry
      }

      for (const [key, source] of tracked) {
        const stored = await storage.readItem(key)
        if (stored === null) continue

        next[key] = { source, output: hash(stored) }
      }

      try {
        await cache.writeItem(MANIFEST_KEY, JSON.stringify({ version: VERSION, entries: next } satisfies ManifestData))
      } catch {
        /* a read-only cache location costs the optimization, not the build */
      }
    },
  }
}
