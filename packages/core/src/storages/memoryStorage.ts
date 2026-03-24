import { createStorage } from '../createStorage.ts'

/**
 * In-memory storage driver. Useful for testing and dry-run scenarios where
 * generated output should be captured without touching the filesystem.
 *
 * All data lives in a `Map` scoped to the storage instance and is discarded
 * when the instance is garbage-collected.
 *
 * @example
 * ```ts
 * import { defineConfig, memoryStorage } from '@kubb/core'
 *
 * export default defineConfig({
 *   input:  { path: './petStore.yaml' },
 *   output: { path: './src/gen', storage: memoryStorage() },
 * })
 * ```
 */
export const memoryStorage = createStorage(() => {
  const store = new Map<string, string>()

  return {
    name: 'memory',
    async hasItem(key: string) {
      return store.has(key)
    },
    async getItem(key: string) {
      return store.get(key) ?? null
    },
    async setItem(key: string, value: string) {
      store.set(key, value)
    },
    async removeItem(key: string) {
      store.delete(key)
    },
    async getKeys(base?: string) {
      const keys = [...store.keys()]
      return base ? keys.filter((k) => k.startsWith(base)) : keys
    },
    async clear(base?: string) {
      if (!base) {
        store.clear()
        return
      }
      for (const key of store.keys()) {
        if (key.startsWith(base)) {
          store.delete(key)
        }
      }
    },
  }
})
