import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/**
 * Bookkeeping for one cached build: the relative paths it covers and timestamps used by the pruner.
 */
export type ManifestEntry = {
  files: Array<string>
  createdAt: number
  lastAccess: number
}

/**
 * The on-disk manifest: a version marker plus an entry per cached build, keyed by fingerprint.
 */
export type ManifestData = {
  version: number
  entries: Record<string, ManifestEntry>
}

/**
 * Reads, writes, and prunes the local cache manifest. All methods are static, so call them as
 * `Manifest.read(dir)`, `Manifest.write(file, data)`, and `Manifest.prune(data, ...)`. A damaged
 * manifest reads as empty so the cache degrades to misses instead of throwing.
 */
export class Manifest {
  /**
   * On-disk layout version for the manifest itself. Bumped when the manifest shape changes; a
   * mismatch makes the whole local cache read as empty.
   */
  static version = 1

  /**
   * Reads the manifest at `dir/manifest.json`. A missing, corrupt, or version-mismatched file reads
   * as an empty manifest.
   */
  static async read(dir: string): Promise<ManifestData> {
    try {
      const parsed = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8')) as ManifestData
      if (parsed.version !== Manifest.version || typeof parsed.entries !== 'object') {
        return Manifest.#empty()
      }
      return parsed
    } catch {
      return Manifest.#empty()
    }
  }

  /**
   * Writes `file` atomically: contents go to a unique temp file in the same directory, then a
   * rename swaps it into place so a concurrent reader never sees a half-written file.
   */
  static async write(file: string, data: string | Uint8Array): Promise<void> {
    await mkdir(dirname(file), { recursive: true })
    const tmp = `${file}.${randomBytes(6).toString('hex')}.tmp`
    await writeFile(tmp, data)
    await rename(tmp, file)
  }

  /**
   * Selects the keys to evict so the cache stays within `ttlDays` and `maxEntries`. Returns the
   * surviving manifest plus the evicted keys (the caller deletes their blobs). Pure, does no IO.
   */
  static prune(
    manifest: ManifestData,
    { maxEntries, ttlDays, now }: { maxEntries: number; ttlDays: number; now: number },
  ): {
    manifest: ManifestData
    removed: Array<string>
  } {
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000
    const removed: Array<string> = []
    const kept: Array<[string, ManifestEntry]> = []

    for (const [key, entry] of Object.entries(manifest.entries)) {
      if (now - entry.lastAccess > ttlMs) {
        removed.push(key)
      } else {
        kept.push([key, entry])
      }
    }

    if (kept.length > maxEntries) {
      kept.sort((a, b) => b[1].lastAccess - a[1].lastAccess)
      for (const [key] of kept.splice(maxEntries)) {
        removed.push(key)
      }
    }

    return { manifest: { version: Manifest.version, entries: Object.fromEntries(kept) }, removed }
  }

  static #empty(): ManifestData {
    return { version: Manifest.version, entries: {} }
  }
}
