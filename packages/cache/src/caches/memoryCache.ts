import { type Cache, type CachedSnapshot, createCache } from '@kubb/core'

/**
 * In-memory cache backed by a `Map`. Snapshots live only for the lifetime of the
 * process, so it never speeds up a real cold start — it exists for tests and for
 * composing into {@link tieredCache} as a fast first tier during a long-running
 * watch session.
 *
 * @example
 * ```ts
 * import { memoryCache } from '@kubb/cache'
 *
 * export default defineConfig({
 *   cache: memoryCache(),
 * })
 * ```
 */
export const memoryCache: () => Cache = createCache(() => {
  const store = new Map<string, CachedSnapshot>()

  return {
    name: 'memory',
    async restore({ key }) {
      return store.get(key) ?? null
    },
    async persist({ key, snapshot }) {
      store.set(key, snapshot)
    },
  }
})
