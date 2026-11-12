---
layout: doc
title: Storage
description: Storage backends decide where generated files are written. Covers
  createStorage, the Storage interface, and the built-in fsStorage and
  memoryStorage backends.
outline:
  - 2
  - 3
order: 7
navigation:
  title: Storage
  icon: i-iconoir-database
---

# Storage

Storage backends persist generated files in the filesystem, memory, or a custom destination.

## `createStorage`

`createStorage` takes a builder function `(options: TOptions) => Storage` and returns a factory `(options?: TOptions) => Storage`. Call the returned factory to create a backend.

```typescript [memory-storage.ts]
import { createStorage } from 'kubb/kit'

export const memoryStorage = createStorage(() => {
  const store = new Map<string, string>()
  return {
    name: 'memory',
    async readItem(key) {
      return store.get(key) ?? null
    },
    async writeItem(key, value) {
      store.set(key, value)
    },
    async removeItem(key) {
      store.delete(key)
    },
    async readKeys(base) {
      const keys = [...store.keys()]
      return base ? keys.filter((k) => k.startsWith(base)) : keys
    },
    async empty(base) {
      if (!base) return store.clear()
      for (const k of store.keys()) if (k.startsWith(base)) store.delete(k)
    },
  }
})
```

## `Storage` interface {#storage-interface}

The engine consumes this interface and exposes the backend through the build result.

| Member         | Params                                                              | Returns                   | Purpose                                                                                                                        |
| -------------- | ------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`         |                                                                     | `string`                  | Identifier for logs and diagnostics, such as `'fs'` or `'memory'`. Format, lint, and `postGenerate` run only when it is `'fs'` |
| `readItem()`   | `key: string`                                                       | `Promise<string \| null>` | Retrieve an item's content                                                                                                     |
| `writeItem()`  | `key: string, value: string, options?: { stored?: string \| null }` | `Promise<void>`           | Write an item. `stored` is the previous content when Kubb already read it, so a backend can skip a second read                 |
| `removeItem()` | `key: string`                                                       | `Promise<void>`           | Delete an item                                                                                                                 |
| `readKeys()`   | `base?: string`                                                     | `Promise<string[]>`       | List keys, optionally filtered by prefix                                                                                       |
| `empty()`      | `base?: string`                                                     | `Promise<void>`           | Delete all items, optionally scoped by prefix                                                                                  |

Omitting `base` on `empty()` is implementation-defined. `memoryStorage` wipes every entry, while the filesystem-backed `fsStorage` treats a missing `base` as a no-op and deletes nothing.

Every member is required. `readItem` returns `null` for a missing key. Kubb skips `writeItem` for a file whose content did not change, so do not expect one call per generated file.

`readKeys()` also differs per backend. `memoryStorage` returns the stored keys, which are absolute paths. `fsStorage` returns paths relative to `base`, and lists the current working directory when `base` is omitted.

## `fsStorage`

`fsStorage` is the default backend. It writes each file to its path on disk and creates directories as needed.

## `memoryStorage`

`memoryStorage` writes nothing to disk, so it suits plugin tests, CI validation, and dry runs.

Both ship from `kubb/kit` and go straight into the config's `storage` field.
