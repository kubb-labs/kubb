---
layout: doc
title: Storage - Where Kubb writes generated files
description: Storage backends decide where Kubb writes generated files. Covers createStorage, the Storage interface, and the fsStorage and memoryStorage backends.
outline:
  - 2
  - 3
order: 7
navigation:
  title: Storage
  icon: i-iconoir-database
---

# Storage

A storage backend decides where Kubb writes generated files: to disk, to memory, or to your own destination. Set it with the config's [`storage`](/docs/5.x/reference/configuration#storage) field.

## Built-in backends

Both ship from `kubb/kit` and go straight into `storage`.

| Backend           | `name`     | Writes                                                                                     |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------ |
| `fsStorage()`     | `'fs'`     | Each file to its path on disk, creating folders. Skips a file with the same content. The default. |
| `memoryStorage()` | `'memory'` | A `Map` in memory, so nothing reaches disk. Suits plugin tests, CI checks, and dry runs.   |

> [!NOTE]
> `output.format`, `output.lint`, and `output.postGenerate` run only when the backend's `name` is `'fs'`.

## `createStorage`

`createStorage` takes a builder `(options: TOptions) => Storage` and returns a factory `(options?: TOptions) => Storage`. This is the built-in `memoryStorage`:

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
      for (const k of store.keys()) if (!base || k.startsWith(base)) store.delete(k)
    },
  }
})
```

## `Storage` interface {#storage-interface}

Every member is required. Keys are the files' absolute paths, and the build result exposes the backend as `storage`.

| Member         | Params                                                              | Returns                   | Does                                                                                                   |
| -------------- | ------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `name`         |                                                                     | `string`                  | Names the backend in logs and diagnostics.                                                             |
| `readItem()`   | `key: string`                                                       | `Promise<string \| null>` | Returns an item's content, or `null` for a missing key.                                                |
| `writeItem()`  | `key: string, value: string, options?: { stored?: string \| null }` | `Promise<void>`           | Writes an item. `stored` is the previous content when Kubb already read it.                            |
| `removeItem()` | `key: string`                                                       | `Promise<void>`           | Deletes an item. Does nothing for a missing key.                                                       |
| `readKeys()`   | `base?: string`                                                     | `Promise<string[]>`       | Lists keys, optionally under a prefix.                                                                 |
| `empty()`      | `base?: string`                                                     | `Promise<void>`           | Deletes every item, optionally under a prefix. Without `base`, the backend decides. See [Storage keys](/docs/5.x/topics/plugin-internals#storage-keys). |

> [!NOTE]
> Kubb skips `writeItem` for a file whose content did not change, so do not expect one call per generated file.
