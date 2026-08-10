/**
 * Backend that persists generated files. Kubb ships with `fsStorage` (writes
 * to disk) and `memoryStorage` (keeps everything in RAM). Implement this
 * interface to write somewhere else, such as S3 or a database.
 *
 * Method names follow Node's filesystem vocabulary, so `readItem` reads like
 * `readFile`, `writeItem` like `writeFile`, and `ensureItem` like fs-extra's
 * `ensureFile`.
 */
export type Storage = {
  /**
   * Identifier used in logs and diagnostics (`'fs'`, `'memory'`, `'s3'`).
   */
  readonly name: string
  /**
   * Returns `true` when an entry for `key` exists.
   */
  existsItem(key: string): Promise<boolean>
  /**
   * Reads the stored string. Returns `null` when the key is missing.
   */
  readItem(key: string): Promise<string | null>
  /**
   * Stores `value` under `key`, creating any required structure (directories,
   * buckets, ...).
   */
  writeItem(key: string, value: string): Promise<void>
  /**
   * Returns the string stored under `key`, writing the result of `factory`
   * first when the key is missing. A stored empty string counts as present, so
   * `factory` runs only when nothing is there at all.
   *
   * `createStorage` supplies this method when a backend omits it. Implement it
   * yourself when the backend can do the read and the conditional write in one
   * atomic operation.
   */
  ensureItem(key: string, factory: () => string | Promise<string>): Promise<string>
  /**
   * Deletes the entry for `key`. No-op when the key does not exist.
   */
  removeItem(key: string): Promise<void>
  /**
   * Returns every key. Pass `base` to filter to keys starting with that prefix.
   */
  readKeys(base?: string): Promise<Array<string>>
  /**
   * Removes stored entries. Pass `base` to scope the wipe to a key prefix.
   *
   * Omitting `base` is implementation-defined: in-memory stores wipe every
   * entry, while filesystem-backed stores treat a missing `base` as a no-op so
   * a bare `empty()` can never delete outside a known output directory.
   */
  empty(base?: string): Promise<void>
}

/**
 * What a `createStorage` builder returns. Same shape as {@link Storage} except
 * `ensureItem` is optional, since `createStorage` derives one from `readItem`
 * and `writeItem` when the backend leaves it out.
 */
export type StorageDefinition = Omit<Storage, 'ensureItem'> & Partial<Pick<Storage, 'ensureItem'>>

/**
 * Defines a custom storage backend. The builder receives user options and
 * returns a `StorageDefinition`. Kubb ships with filesystem and in-memory
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
 *     async existsItem(key) {
 *       return store.has(key)
 *     },
 *     async readItem(key) {
 *       return store.get(key) ?? null
 *     },
 *     async writeItem(key, value) {
 *       store.set(key, value)
 *     },
 *     async removeItem(key) {
 *       store.delete(key)
 *     },
 *     async readKeys(base) {
 *       const keys = [...store.keys()]
 *       return base ? keys.filter((k) => k.startsWith(base)) : keys
 *     },
 *     async empty(base) {
 *       if (!base) store.clear()
 *     },
 *   }
 * })
 * ```
 */
export function createStorage<TOptions = Record<string, never>>(build: (options: TOptions) => StorageDefinition): (options?: TOptions) => Storage {
  return (options) => {
    const storage = build((options ?? {}) as TOptions)

    if (storage.ensureItem) return storage as Storage

    return {
      ...storage,
      async ensureItem(key: string, factory: () => string | Promise<string>): Promise<string> {
        const stored = await storage.readItem(key)
        if (stored !== null) return stored

        const value = await factory()
        await storage.writeItem(key, value)
        return value
      },
    }
  }
}
