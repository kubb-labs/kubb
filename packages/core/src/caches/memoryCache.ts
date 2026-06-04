import { type CachedSnapshot, createCache, type NodeManifest } from '../createCache.ts'

/**
 * In-memory cache backed by a `Map`. Snapshots live only for the lifetime of the
 * process, so it never speeds up a real cold start. It exists for tests and for
 * reusing snapshots within a single watch session.
 *
 * @example
 * ```ts
 * import { memoryCache } from '@kubb/core'
 *
 * export default defineConfig({
 *   cache: memoryCache(),
 * })
 * ```
 */
export const memoryCache = createCache(() => {
  const store = new Map<string, CachedSnapshot>()
  const manifests = new Map<string, NodeManifest>()

  return {
    name: 'memory',
    async restore({ key }) {
      return store.get(key) ?? null
    },
    async persist({ key, snapshot }) {
      store.set(key, snapshot)
    },
    async restoreManifest({ configKey }) {
      return manifests.get(configKey) ?? null
    },
    async persistManifest({ configKey, manifest }) {
      manifests.set(configKey, manifest)
    },
  }
})
