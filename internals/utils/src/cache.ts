/**
 * An async in-memory key-value store.
 * Designed to be subclassed — override `flush` to persist entries to disk or a remote store.
 */
export class Cache<T> {
  #buffer = new Map<string, T>()

  /** Returns the cached value for `key`, or `null` when not found. */
  async get(key: string): Promise<T | null> {
    return this.#buffer.get(key) ?? null
  }

  /** Stores `value` under `key`, overwriting any existing entry. */
  async set(key: string, value: T): Promise<void> {
    this.#buffer.set(key, value)
  }

  /** Removes the entry for `key`. No-op when the key does not exist. */
  async delete(key: string): Promise<void> {
    this.#buffer.delete(key)
  }

  /** Removes all entries from the cache. */
  async clear(): Promise<void> {
    this.#buffer.clear()
  }

  /** Returns all current keys. */
  async keys(): Promise<string[]> {
    return [...this.#buffer.keys()]
  }

  /** Returns all current values. */
  async values(): Promise<T[]> {
    return [...this.#buffer.values()]
  }

  /**
   * Persists the current cache contents to an external store.
   * No-op in the base class — override in subclasses to add durability.
   */
  async flush(): Promise<void> {}
}
