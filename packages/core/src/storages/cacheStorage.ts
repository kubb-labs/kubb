import { hash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStorage } from '../createStorage.ts'
import { fsStorage } from './fsStorage.ts'

type CacheStorageOptions = {
  /**
   * Project root the cache directory is derived from.
   *
   * @default process.cwd()
   */
  root?: string
}

/**
 * Directory Kubb keeps build caches in. A project with a `node_modules` gets
 * `node_modules/.cache/kubb`, the convention babel and eslint already use, so the cache stays out
 * of version control. Without one it falls back to the OS temp directory, keyed by root so two
 * projects sharing that directory keep their own cache.
 *
 * @example Inside a project
 * `resolveCacheDir('/project') // '/project/node_modules/.cache/kubb'`
 */
export function resolveCacheDir(root: string): string {
  const nodeModules = join(root, 'node_modules')
  if (existsSync(nodeModules)) return join(nodeModules, '.cache', 'kubb')

  return join(tmpdir(), 'kubb', hash('sha256', root).slice(0, 16))
}

/**
 * Filesystem storage for build caches rather than generated code. Keys are plain names resolved
 * inside {@link resolveCacheDir}, so a caller stores `'x.json'` without knowing where the cache
 * lives. Kept apart from the configured output storage, which may not be a local disk at all.
 *
 * @example
 * ```ts
 * const cache = cacheStorage({ root: config.root })
 * await cache.writeItem('output-manifest.json', JSON.stringify(entries))
 * ```
 */
export const cacheStorage = createStorage(({ root = process.cwd() }: CacheStorageOptions) => {
  const dir = resolveCacheDir(root)
  const fs = fsStorage()
  const toPath = (key: string) => join(dir, key)

  return {
    name: 'cache',
    readItem: (key) => fs.readItem(toPath(key)),
    writeItem: (key, value) => fs.writeItem(toPath(key), value),
    removeItem: (key) => fs.removeItem(toPath(key)),
    readKeys: (base) => fs.readKeys(base ? toPath(base) : dir),
    // Same rule as `fsStorage`: a bare `empty()` deletes nothing, so storage-generic code cannot wipe the cache directory by accident.
    empty: async (base) => (base ? fs.empty(toPath(base)) : undefined),
  }
})
