import { createHash } from 'node:crypto'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { type Cache, type CachedSnapshot, createCache } from '@kubb/core'
import { Manifest } from '../manifest.ts'

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
 * Local filesystem cache. Stores each build snapshot as a set of content blobs plus
 * an index, tracked by a manifest under `node_modules/.cache/kubb/` (the Nx/Vitest
 * convention). Least-recently-used and expired entries are pruned on every persist.
 *
 * @example
 * ```ts
 * import { fsCache } from '@kubb/cache'
 *
 * export default defineConfig({
 *   cache: fsCache(),
 * })
 * ```
 */
export const fsCache: (options?: FsCacheOptions) => Cache = createCache((options: FsCacheOptions = {}) => {
  const dir = resolve(options.dir ?? join('node_modules', '.cache', 'kubb'))
  const maxEntries = options.maxEntries ?? 50
  const ttlDays = options.ttlDays ?? 7
  const blobsDir = join(dir, 'blobs')

  return {
    name: 'fs',
    async restore({ key }) {
      const manifest = await Manifest.read(dir)
      const entry = manifest.entries[key]
      if (!entry) {
        return null
      }

      try {
        const index = JSON.parse(await readFile(join(blobsDir, key, 'index.json'), 'utf8')) as IndexFile
        const files: Record<string, string> = {}
        for (const { path, blob } of index) {
          files[path] = await readFile(join(blobsDir, key, blob), 'utf8')
        }

        entry.lastAccess = Date.now()
        await Manifest.write(dir, manifest).catch(() => {})

        return { files }
      } catch {
        return null
      }
    },
    async persist({ key, snapshot }: { key: string; snapshot: CachedSnapshot }) {
      const entryDir = join(blobsDir, key)
      await mkdir(entryDir, { recursive: true })

      const index: IndexFile = []
      for (const [path, source] of Object.entries(snapshot.files)) {
        const blob = blobName(path)
        await Manifest.writeFileAtomic(join(entryDir, blob), source)
        index.push({ path, blob })
      }
      await Manifest.writeFileAtomic(join(entryDir, 'index.json'), JSON.stringify(index))

      const manifest = await Manifest.read(dir)
      const now = Date.now()
      manifest.entries[key] = { files: index.map((item) => item.path), createdAt: now, lastAccess: now }

      const pruned = Manifest.prune(manifest, { maxEntries, ttlDays, now })
      await Promise.all(pruned.removed.map((removedKey) => rm(join(blobsDir, removedKey), { recursive: true, force: true })))
      await Manifest.write(dir, pruned.manifest)
    },
  }
})
