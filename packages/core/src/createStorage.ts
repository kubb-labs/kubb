export type Storage = {
  /**
   * Identifier used for logging and debugging (e.g. `'fs'`, `'s3'`).
   */
  readonly name: string;
  /**
   * Returns `true` when an entry for `key` exists in storage.
   */
  hasItem(key: string): Promise<boolean>;
  /**
   * Returns the stored string value, or `null` when `key` does not exist.
   */
  getItem(key: string): Promise<string | null>;
  /**
   * Persists `value` under `key`, creating any required structure.
   */
  setItem(key: string, value: string): Promise<void>;
  /**
   *  Removes the entry for `key`. No-ops when the key does not exist.
   */
  removeItem(key: string): Promise<void>;
  /**
   * Returns all keys, optionally filtered to those starting with `base`.
   */
  getKeys(base?: string): Promise<Array<string>>;
  /**
   * Removes all entries, optionally scoped to those starting with `base`.
   */
  clear(base?: string): Promise<void>;
  /**
   * Optional teardown hook called after the build completes.
   */
  dispose?(): Promise<void>;
};

/**
 * Creates a storage factory. Call the returned function with optional options to get the storage instance.
 *
 * @example
 * export const memoryStorage = createStorage(() => {
 *   const store = new Map<string, string>()
 *   return {
 *     name: 'memory',
 *     async hasItem(key) { return store.has(key) },
 *     async getItem(key) { return store.get(key) ?? null },
 *     async setItem(key, value) { store.set(key, value) },
 *     async removeItem(key) { store.delete(key) },
 *     async getKeys(base) {
 *       const keys = [...store.keys()]
 *       return base ? keys.filter((k) => k.startsWith(base)) : keys
 *     },
 *     async clear(base) { if (!base) store.clear() },
 *   }
 * })
 */
export function createStorage<TOptions = Record<string, never>>(
  build: (options: TOptions) => Storage,
): (options?: TOptions) => Storage {
  return (options) => build(options ?? ({} as TOptions));
}
