export class Cache<T> {
  #buffer = new Map<string, T>()

  async get(key: string): Promise<T | null> {
    return this.#buffer.get(key) ?? null
  }

  async set(key: string, value: T): Promise<void> {
    this.#buffer.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.#buffer.delete(key)
  }

  async clear(): Promise<void> {
    this.#buffer.clear()
  }

  async keys(): Promise<string[]> {
    return [...this.#buffer.keys()]
  }

  async values(): Promise<T[]> {
    return [...this.#buffer.values()]
  }

  async flush(): Promise<void> {
    // No-op for base cache
  }
}
