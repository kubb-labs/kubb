---
'@kubb/core': patch
'@kubb/kit': patch
---

Rename the `Storage` and `NodeCache` methods to Node's filesystem vocabulary and add `ensureItem` to both.

`getOrSet` on `NodeCache` named its implementation rather than what a caller wants, and it had no counterpart on `Storage`. It is now `ensureItem`, after fs-extra's `ensureFile` and `ensureDir`: return what is stored under the key, computing and writing it first when nothing is there. The rest of the surface moves to matching fs verbs.

| Before                 | After        |
| ---------------------- | ------------ |
| `hasItem`              | `existsItem` |
| `getItem`              | `readItem`   |
| `setItem`              | `writeItem`  |
| `getKeys`              | `readKeys`   |
| `clear`                | `empty`      |
| `getOrSet` (NodeCache) | `ensureItem` |

`removeItem` keeps its name, since it already matches `fs.rm`.

Custom backends do not have to implement `ensureItem`. The builder passed to `createStorage` returns the new `StorageDefinition` type, where `ensureItem` is optional, and `createStorage` derives one from `readItem` and `writeItem` when it is missing. A stored empty string counts as present, so the factory runs only when the key holds nothing at all. Implement `ensureItem` yourself when the backend can do the read and the conditional write in one atomic operation.

```ts
const imports = ctx.cache.ensureItem('plugin-ts:imports', () => ctx.resolver.imports({ node, root, output }))
const source = await storage.ensureItem(path, () => render(node))
```
