import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStorage } from '../createStorage.ts'
import { fsStorage } from './fsStorage.ts'

type CacheStorageOptions = {
  /**
   * Project root the cache directory is derived from. Defaults to the current working directory.
   */
  root?: string
}

/**
 * Directory Kubb keeps build caches in.
 *
 * A project with a `node_modules` gets `node_modules/.cache/kubb`, the convention babel and eslint
 * already use, so the cache stays out of version control and next to the install it belongs to.
 * Without one (a global install, a sandbox, a read-only checkout) it falls back to the OS temp
 * directory, where a cleared cache costs a rebuild and nothing more. The fallback is keyed by root
 * so two projects sharing a temp directory keep their own cache.
 *
 * @example
 * ```ts
 * resolveCacheDir('/project')  // '/project/node_modules/.cache/kubb'
 * ```
 */
export function resolveCacheDir(root: string): string {
  const nodeModules = join(root, 'node_modules')
  if (existsSync(nodeModules)) return join(nodeModules, '.cache', 'kubb')

  return join(tmpdir(), 'kubb', createHash('sha256').update(root).digest('hex').slice(0, 16))
}

/**
 * Filesystem storage for build caches rather than generated code.
 *
 * Keys are plain names resolved inside {@link resolveCacheDir}, so a caller stores `'x.json'`
 * without knowing where the cache lives. It is deliberately separate from the configured output
 * storage: a cache is local build state, and sending it to wherever a project writes its generated
 * code (an in-memory store, a bucket) would either lose it between runs or put it somewhere it
 * does not belong.
 *
 * @example
 * ```ts
 * const cache = cacheStorage({ root: config.root })
 * await cache.writeItem('output-manifest.json', JSON.stringify(entries))
 * ```
 */
export const cacheStorage = createStorage(({ root = process.cwd() }: CacheStorageOptions) => {
  const dir = resolveCacheDir(root)
  const storage = fsStorage()
  const toPath = (key: string) => join(dir, key)

  return {
    name: 'cache',
    async existsItem(key: string) {
      return storage.existsItem(toPath(key))
    },
    async readItem(key: string) {
      return storage.readItem(toPath(key))
    },
    async writeItem(key: string, value: string) {
      return storage.writeItem(toPath(key), value)
    },
    async removeItem(key: string) {
      return storage.removeItem(toPath(key))
    },
    async readKeys(base?: string) {
      return storage.readKeys(base ? toPath(base) : dir)
    },
    async empty(base?: string) {
      return storage.empty(base ? toPath(base) : dir)
    },
  }
})
