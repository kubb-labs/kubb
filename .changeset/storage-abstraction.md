---
"@kubb/core": minor
---

Add storage abstraction for generated output

Introduces a `storage` option in `output` that replaces direct filesystem writes with a pluggable storage layer, inspired by the Nitro/unstorage API.

**New exports from `@kubb/core`:**

- `defineStorage(builder)` — factory helper (same pattern as `definePlugin`/`defineLogger`/`defineAdapter`) that wraps a builder function and makes options optional
- `fsStorage()` — built-in filesystem driver; the default when no `storage` is configured, preserving existing on-disk behaviour
- `memoryStorage()` — built-in in-memory driver; useful for testing and dry-run scenarios
- `DefineStorage` — TypeScript interface for implementing custom drivers

**`output.write` is now deprecated.** Setting `write: false` for dry-runs still works and continues to be supported.

```ts
import { defineConfig, defineStorage, fsStorage } from '@kubb/core'

// default (no change needed for existing configs)
export default defineConfig({
  output: { path: './src/gen' },
})

// explicit filesystem storage
export default defineConfig({
  output: { path: './src/gen', storage: fsStorage() },
})

// custom in-memory storage
export const memoryStorage = defineStorage((_options) => {
  const store = new Map<string, string>()
  return {
    name: 'memory',
    async hasItem(key) { return store.has(key) },
    async getItem(key) { return store.get(key) ?? null },
    async setItem(key, value) { store.set(key, value) },
    async removeItem(key) { store.delete(key) },
    async getKeys() { return [...store.keys()] },
    async clear() { store.clear() },
  }
})
```
