import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
import { clean, read, write } from '@internals/utils'
import { createCache } from '../createCache.ts'

/**
 * Bookkeeping for one cached build: the relative paths it covers and timestamps used by the pruner.
 */
type ManifestEntry = {
  files: Array<string>
  createdAt: number
  lastAccess: number
}

/**
 * The on-disk manifest: a version marker plus an entry per cached build, keyed by fingerprint.
 */
type ManifestData = {
  version: number
  entries: Record<string, ManifestEntry>
}

/**
 * Reads and prunes the local cache manifest. All methods are static, so call them as
 * `Manifest.read(dir)` and `Manifest.prune(data, ...)`. A damaged manifest reads as empty so the
 * cache degrades to misses instead of throwing.
 */
class Manifest {
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
      const parsed = JSON.parse(await read(join(dir, 'manifest.json'))) as ManifestData
      if (parsed.version !== Manifest.version || typeof parsed.entries !== 'object') {
        return Manifest.#empty()
      }
      return parsed
    } catch {
      return Manifest.#empty()
    }
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

/**
 * Options for {@link fsCache}.
 */
export type FsCacheOptions = {
  /**
   * Directory that holds the cache. Resolved against `process.cwd()` when relative.
   *
   * @default 'node_modules/.cache/kubb'
   */
  dir?: string
  /**
   * Maximum number of build snapshots to keep. The least-recently-used entries are
   * evicted once the cache grows past it.
   *
   * @default 50
   */
  maxEntries?: number
  /**
   * Days a snapshot may go untouched before it is evicted.
   *
   * @default 7
   */
  ttlDays?: number
}

type IndexFile = Array<{ path: string; blob: string }>

function blobName(relativePath: string): string {
  return `${createHash('sha256').update(relativePath).digest('hex')}.blob`
}

/**
 * Local filesystem cache. Stores each build snapshot as content blobs plus an index,
 * tracked by a manifest under `node_modules/.cache/kubb/` (the Nx and Vitest
 * convention). Least-recently-used and expired entries are pruned on every persist.
 *
 * @example
 * ```ts
 * import { fsCache } from '@kubb/core'
 *
 * export default defineConfig({
 *   cache: fsCache(),
 * })
 * ```
 */
export const fsCache = createCache((options: FsCacheOptions = {}) => {
  const dir = resolve(options.dir ?? join('node_modules', '.cache', 'kubb'))
  const maxEntries = options.maxEntries ?? 50
  const ttlDays = options.ttlDays ?? 7
  const blobsDir = join(dir, 'blobs')
  const manifestPath = join(dir, 'manifest.json')

  return {
    name: 'fs',
    async restore({ key }) {
      const manifest = await Manifest.read(dir)
      const entry = manifest.entries[key]
      if (!entry) {
        return null
      }

      try {
        const index = JSON.parse(await read(join(blobsDir, key, 'index.json'))) as IndexFile
        const files: Record<string, string> = {}
        for (const { path, blob } of index) {
          files[path] = await read(join(blobsDir, key, blob))
        }

        entry.lastAccess = Date.now()
        await write(manifestPath, JSON.stringify(manifest)).catch(() => {})

        return { files }
      } catch {
        return null
      }
    },
    async persist({ key, snapshot }) {
      const entryDir = join(blobsDir, key)

      const index: IndexFile = []
      for (const [path, source] of Object.entries(snapshot.files)) {
        const blob = blobName(path)
        await write(join(entryDir, blob), source)
        index.push({ path, blob })
      }
      await write(join(entryDir, 'index.json'), JSON.stringify(index))

      const manifest = await Manifest.read(dir)
      const now = Date.now()
      manifest.entries[key] = { files: index.map((item) => item.path), createdAt: now, lastAccess: now }

      const pruned = Manifest.prune(manifest, { maxEntries, ttlDays, now })
      await Promise.all(pruned.removed.map((removedKey) => clean(join(blobsDir, removedKey))))
      await write(manifestPath, JSON.stringify(pruned.manifest))
    },
  }
})
