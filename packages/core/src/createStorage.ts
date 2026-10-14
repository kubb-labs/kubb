/**
 * Backend that persists generated files. Kubb ships with `fsStorage` (writes
 * to disk) and `memoryStorage` (keeps everything in RAM). Implement this
 * interface to write somewhere else, such as S3 or a database.
 *
 * Method names follow Node's filesystem vocabulary, so `readItem` reads like
 * `readFile` and `writeItem` like `writeFile`.
 */
export type Storage = {
  /**
   * Identifier used in logs and diagnostics (`'fs'`, `'memory'`, `'s3'`).
   */
  readonly name: string
  /**
   * Reads the stored string. Returns `null` when the key is missing.
   */
  readItem(key: string): Promise<string | null>
  /**
   * Stores `value` under `key`, creating any required structure (directories,
   * buckets, ...).
   *
   * Pass `stored` when the caller already read the previous value to avoid
   * reading it again in storage implementations that support the optimization.
   */
  writeItem(key: string, value: string, options?: { stored?: string | null }): Promise<void>
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
 * Defines a custom storage backend: `build` takes the user's options and returns a `Storage`. See `memoryStorage` for the built-in in-memory implementation.
 */
export const createStorage =
  <TOptions = Record<string, never>>(build: (options: TOptions) => Storage) =>
  (options?: TOptions): Storage =>
    build((options ?? {}) as TOptions)
