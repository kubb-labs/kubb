/**
 * Backend that persists generated files. Kubb ships with `fsStorage` (writes
 * to disk) and `memoryStorage` (keeps everything in RAM). Implement this
 * interface to write somewhere else, such as S3 or a database.
 */
export type Storage = {
  /**
   * Identifier used in logs and diagnostics (`'fs'`, `'memory'`, `'s3'`).
   */
  readonly name: string
  /**
   * Returns `true` when an entry for `key` exists.
   */
  hasItem(key: string): Promise<boolean>
  /**
   * Reads the stored string. Returns `null` when the key is missing.
   */
  getItem(key: string): Promise<string | null>
  /**
   * Stores `value` under `key`, creating any required structure (directories,
   * buckets, ...).
   */
  setItem(key: string, value: string): Promise<void>
  /**
   * Deletes the entry for `key`. No-op when the key does not exist.
   */
  removeItem(key: string): Promise<void>
  /**
   * Returns every key. Pass `base` to filter to keys starting with that prefix.
   */
  getKeys(base?: string): Promise<Array<string>>
  /**
   * Removes every entry. Pass `base` to scope the wipe to a key prefix.
   */
  clear(base?: string): Promise<void>
  /**
   * Optional teardown hook called after the build completes. Use to flush
   * buffers, close connections, or release file locks.
   */
  dispose?(): Promise<void>
}

/**
 * Defines a custom storage backend. The builder receives user options and
 * returns a `Storage` implementation. Kubb ships with filesystem and in-memory
 * storages. A custom backend writes generated files elsewhere, such as cloud
 * storage or a database.
 *
 * @example In-memory storage (the built-in implementation)
 * ```ts
 * import { createStorage } from '@kubb/core'
 *
 * export const memoryStorage = createStorage(() => {
 *   const store = new Map<string, string>()
 *
 *   return {
 *     name: 'memory',
 *     async hasItem(key) {
 *       return store.has(key)
 *     },
 *     async getItem(key) {
 *       return store.get(key) ?? null
 *     },
 *     async setItem(key, value) {
 *       store.set(key, value)
 *     },
 *     async removeItem(key) {
 *       store.delete(key)
 *     },
 *     async getKeys(base) {
 *       const keys = [...store.keys()]
 *       return base ? keys.filter((k) => k.startsWith(base)) : keys
 *     },
 *     async clear(base) {
 *       if (!base) store.clear()
 *     },
 *   }
 * })
 * ```
 */
export function createStorage<TOptions = Record<string, never>>(build: (options: TOptions) => Storage): (options?: TOptions) => Storage {
  return (options) => build(options ?? ({} as TOptions))
}
