/**
 * Storage interface for persisting Kubb output.
 * Keys are root-relative forward-slash paths (e.g. `src/gen/api/getPets.ts`).
 *
 * Use `defineStorage` to create a typed storage with a name identifier.
 */
export interface DefineStorage {
  /** Identifier used for logging and debugging. */
  readonly name: string
  /** Returns `true` when the given key exists in storage. */
  hasItem(key: string): Promise<boolean>
  /** Returns the stored string value, or `null` when the key does not exist. */
  getItem(key: string): Promise<string | null>
  /** Persist a string value under the given key. */
  setItem(key: string, value: string): Promise<void>
  /** Remove the entry for the given key. Does nothing when the key does not exist. */
  removeItem(key: string): Promise<void>
  /** Returns all keys that start with the optional `base` prefix. */
  getKeys(base?: string): Promise<Array<string>>
  /** Removes all keys that start with the optional `base` prefix. */
  clear(base?: string): Promise<void>
  /** Optional teardown hook — called when the build finishes. */
  dispose?(): Promise<void>
}

/**
 * Wraps a storage builder function to make the options parameter optional,
 *
 * @example
 * ```ts
 * import { defineStorage } from '@kubb/core'
 *
 * export const myStorage = defineStorage((options) => ({
 *   name: 'memory',
 *   async hasItem(key) { return map.has(key) },
 *   async getItem(key) { return map.get(key) ?? null },
 *   async setItem(key, value) { map.set(key, value) },
 *   async removeItem(key) { map.delete(key) },
 *   async getKeys() { return [...map.keys()] },
 *   async clear() { map.clear() },
 * }))
 * ```
 */
export function defineStorage<TOptions = Record<string, never>>(build: (options: TOptions) => DefineStorage): (options?: TOptions) => DefineStorage {
  return (options) => build(options ?? ({} as TOptions))
}
