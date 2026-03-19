/**
 * Storage interface for persisting Kubb output.
 *
 * Keys are root-relative forward-slash paths (e.g. `src/gen/api/getPets.ts`).
 * Implement this interface to route generated files to any backend — filesystem,
 * S3, Redis, in-memory, etc.
 *
 * Use `createStorage` to create a typed storage driver.
 */
export interface DefineStorage {
  /** Identifier used for logging and debugging (e.g. `'fs'`, `'s3'`). */
  readonly name: string
  /** Returns `true` when an entry for `key` exists in storage. */
  hasItem(key: string): Promise<boolean>
  /** Returns the stored string value, or `null` when `key` does not exist. */
  getItem(key: string): Promise<string | null>
  /** Persists `value` under `key`, creating any required structure. */
  setItem(key: string, value: string): Promise<void>
  /** Removes the entry for `key`. No-ops when the key does not exist. */
  removeItem(key: string): Promise<void>
  /** Returns all keys, optionally filtered to those starting with `base`. */
  getKeys(base?: string): Promise<Array<string>>
  /** Removes all entries, optionally scoped to those starting with `base`. */
  clear(base?: string): Promise<void>
  /** Optional teardown hook called after the build completes. */
  dispose?(): Promise<void>
}

/**
 * Wraps a storage builder so the `options` argument is optional, following the
 * same factory pattern as `createPlugin`, `createLogger`, and `createAdapter`.
 *
 * The builder receives the resolved options object and must return a
 * `DefineStorage`-compatible object that includes a `name` string.
 *
 * @example
 * ```ts
 * import { createStorage } from '@kubb/core'
 *
 * export const memoryStorage = createStorage((_options) => {
 *   const store = new Map<string, string>()
 *   return {
 *     name: 'memory',
 *     async hasItem(key) { return store.has(key) },
 *     async getItem(key) { return store.get(key) ?? null },
 *     async setItem(key, value) { store.set(key, value) },
 *     async removeItem(key) { store.delete(key) },
 *     async getKeys() { return [...store.keys()] },
 *     async clear() { store.clear() },
 *   }
 * })
 * ```
 */
export function createStorage<TOptions = Record<string, never>>(build: (options: TOptions) => DefineStorage): (options?: TOptions) => DefineStorage {
  return (options) => build(options ?? ({} as TOptions))
}
