/**
 * A snapshot of a completed build: the final rendered source of every generated
 * file, keyed by its path relative to the output root. Restoring a snapshot writes
 * those sources straight to storage, skipping generation entirely.
 *
 * Paths are relative (not absolute) so a snapshot persisted on one machine — or in
 * CI — restores correctly on another with a different checkout root.
 */
export type CachedSnapshot = {
  /**
   * Final source per output file, keyed by the path relative to
   * `resolve(config.root, config.output.path)`.
   */
  files: Record<string, string>
}

/**
 * Backend that stores build snapshots for incremental ("hot") rebuilds. When the
 * input fingerprint matches a stored key, Kubb restores the snapshot instead of
 * regenerating. Kubb ships with `fsCache` (local disk), `turboCache` (Turborepo
 * Remote Cache), `tieredCache` (local + remote), and `memoryCache`. Implement this
 * interface to back the cache with any other store.
 *
 * @see {@link createCache} to build a custom backend.
 */
export type Cache = {
  /**
   * Identifier used in logs and diagnostics (`'fs'`, `'turbo'`, `'memory'`).
   */
  readonly name: string
  /**
   * Returns the snapshot stored under `key`, or `null` on a miss. A backend must
   * never throw on a miss or a transient failure — return `null` so the build falls
   * through to regeneration.
   */
  restore(params: { key: string }): Promise<CachedSnapshot | null>
  /**
   * Stores `snapshot` under `key`. Only called after a successful build with no
   * error diagnostics.
   */
  persist(params: { key: string; snapshot: CachedSnapshot }): Promise<void>
  /**
   * Optional teardown called after the build. Use to flush buffers or close
   * connections.
   */
  dispose?(): Promise<void>
}

/**
 * Defines a custom cache backend. The builder receives user options and returns a
 * {@link Cache}. Reach for this when neither the filesystem nor the Turborepo
 * backend fits — for example to store snapshots in Redis or a database.
 *
 * @example In-memory cache (the built-in implementation)
 * ```ts
 * import { createCache } from '@kubb/core'
 *
 * export const memoryCache = createCache(() => {
 *   const store = new Map<string, CachedSnapshot>()
 *
 *   return {
 *     name: 'memory',
 *     async restore({ key }) {
 *       return store.get(key) ?? null
 *     },
 *     async persist({ key, snapshot }) {
 *       store.set(key, snapshot)
 *     },
 *   }
 * })
 * ```
 */
export function createCache<TOptions = Record<string, never>>(build: (options: TOptions) => Cache): (options?: TOptions) => Cache {
  return (options) => build(options ?? ({} as TOptions))
}
