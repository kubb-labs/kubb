import cacache from 'cacache'
import { join } from 'node:path'
import pLimit from 'p-limit'

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

export class ContentCache<T> extends Cache<T> {
  #buffer = new Map<string, T>()
  #bufferLimit = 1000
  #cachePath = join(process.cwd(), 'node_modules/.kubb/files')
  #limit = pLimit(10)

  async get(hash: string): Promise<T | null> {
    if (this.#buffer.has(hash)) {
      return this.#buffer.get(hash) ?? null
    }

    try {
      const entry = await cacache.get(this.#cachePath, hash)
      const value = JSON.parse(entry.data.toString()) as T
      this.#buffer.set(hash, value)
      return value
    } catch {
      return null
    }
  }

  async set(hash: string, value: T): Promise<void> {
    this.#buffer.set(hash, value)

    if (this.#buffer.size >= this.#bufferLimit) {
      await this.flush()
    }
  }

  async flush(): Promise<void> {
    const entries = Array.from(this.#buffer.entries())
    this.#buffer.clear()

    await Promise.all(
      entries.map(([key, value]) =>
        this.#limit(() =>
          cacache.put(this.#cachePath, key, JSON.stringify(value))
        )
      )
    )
  }

  async delete(hash: string): Promise<void> {
    this.#buffer.delete(hash)
    await cacache.rm.entry(this.#cachePath, hash)
  }

  async clear(): Promise<void> {
    this.#buffer.clear()
    await cacache.rm.all(this.#cachePath)
  }

  async keys(): Promise<string[]> {
    if (this.#buffer.size < this.#bufferLimit) {
      // Return keys from the in-memory buffer only (not yet flushed)
      return [...this.#buffer.keys()]
    }

    // Buffer is full or flushed, return keys from disk
    const diskEntries = await cacache.ls(this.#cachePath)
    return Object.keys(diskEntries)
  }

  async values(): Promise<T[]> {
    if (this.#buffer.size < this.#bufferLimit) {
      // Return values from in-memory buffer only
      return [...this.#buffer.values()]
    }

    // Buffer is full or flushed, return values from disk
    const diskKeys = await this.keys()
    const result: T[] = []

    for (const key of diskKeys) {
      const value = await this.get(key)
      if (value) result.push(value)
    }

    return result
  }

}
