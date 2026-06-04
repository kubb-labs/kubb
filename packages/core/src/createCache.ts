/**
 * A snapshot of a completed build: the final rendered source of every generated
 * file, keyed by its path relative to the output root. Restoring a snapshot writes
 * those sources straight to storage, skipping generation entirely.
 *
 * Paths are relative, not absolute, so the snapshot never depends on where the
 * project lives on disk.
 */
export type CachedSnapshot = {
  /**
   * Final source per output file, keyed by the path relative to
   * `resolve(config.root, config.output.path)`.
   */
  files: Record<string, string>
}

/**
 * The barrel-relevant metadata of one source in a generated file. A replayed file carries these so
 * `@kubb/middleware-barrel` reconstructs the same `export { ... }` without re-running generation.
 */
export type NodeManifestExport = {
  name: string | null
  isIndexable: boolean
  isTypeOnly: boolean
}

/**
 * One file produced by a single input node: its path relative to the output root, the rendered
 * source, and the export metadata barrels need.
 */
export type NodeManifestFile = {
  relPath: string
  source: string
  exports: Array<NodeManifestExport>
}

/**
 * What one schema or operation produced last run: its content key and the files it owns.
 */
export type NodeManifestEntry = {
  nodeKey: string
  files: Array<NodeManifestFile>
}

/**
 * Per-node record of the previous build, used for partial ("only rerun what changed") rebuilds.
 * Keyed by a stable node id. `shared` lists paths produced by more than one node (single-file mode,
 * grouping, aggregate or plugin-level output), which are never replayed from a single node.
 */
export type NodeManifest = {
  version: number
  nodes: Record<string, NodeManifestEntry>
  shared: Array<string>
}

/**
 * Backend that stores build snapshots for incremental ("hot") rebuilds. When the
 * input fingerprint matches a stored key, Kubb restores the snapshot instead of
 * regenerating. Kubb ships with `fsCache` (local disk) and `memoryCache`. Implement
 * this interface to back the cache with any other store.
 *
 * @see {@link createCache} to build a custom backend.
 */
export type Cache = {
  /**
   * Identifier used in logs and diagnostics (`'fs'`, `'memory'`).
   */
  readonly name: string
  /**
   * Returns the snapshot stored under `key`, or `null` on a miss. A backend never
   * throws on a miss or a transient failure. It returns `null` so the build falls
   * through to regeneration.
   */
  restore(params: { key: string }): Promise<CachedSnapshot | null>
  /**
   * Stores `snapshot` under `key`. Only called after a successful build with no
   * error diagnostics.
   */
  persist(params: { key: string; snapshot: CachedSnapshot }): Promise<void>
  /**
   * Returns the per-node manifest stored for `configKey`, or `null` when absent. A backend that
   * implements this (and `persistManifest`) enables partial rebuilds: only the schemas and
   * operations whose content changed are regenerated. Omit both to support whole-build caching only.
   */
  restoreManifest?(params: { configKey: string }): Promise<NodeManifest | null>
  /**
   * Stores the per-node `manifest` for `configKey`. Only called after a successful build.
   */
  persistManifest?(params: { configKey: string; manifest: NodeManifest }): Promise<void>
  /**
   * Optional teardown called after the build. Use to flush buffers or close
   * connections.
   */
  dispose?(): Promise<void>
}

/**
 * Defines a custom cache backend. The builder receives user options and returns a
 * {@link Cache}. Reach for this when the filesystem backend doesn't fit, for
 * example to store snapshots in Redis or a database.
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
