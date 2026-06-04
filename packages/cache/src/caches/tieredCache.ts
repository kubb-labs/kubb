import type { Cache } from '@kubb/core'

/**
 * Combines several caches into one, ordered fastest to slowest (e.g.
 * `[fsCache(), turboCache()]`). `restore` walks the tiers in order, returns the
 * first hit, and back-fills every earlier tier so the next run hits locally.
 * `persist` writes to every tier. A failing tier never breaks the build — its error
 * is swallowed so a flaky remote can't fail a local build.
 *
 * @example
 * ```ts
 * import { tieredCache, fsCache, turboCache } from '@kubb/cache'
 *
 * export default defineConfig({
 *   cache: tieredCache([fsCache(), turboCache()]),
 * })
 * ```
 */
export function tieredCache(caches: Array<Cache>): Cache {
  return {
    name: `tiered(${caches.map((cache) => cache.name).join(',')})`,
    async restore({ key }) {
      for (let index = 0; index < caches.length; index++) {
        const snapshot = await caches[index]!.restore({ key }).catch(() => null)
        if (snapshot) {
          // Back-fill the faster tiers that missed so the next run hits closer to home.
          await Promise.all(caches.slice(0, index).map((cache) => cache.persist({ key, snapshot }).catch(() => {})))
          return snapshot
        }
      }
      return null
    },
    async persist({ key, snapshot }) {
      await Promise.all(caches.map((cache) => cache.persist({ key, snapshot }).catch(() => {})))
    },
    async dispose() {
      await Promise.all(caches.map((cache) => cache.dispose?.()))
    },
  }
}
