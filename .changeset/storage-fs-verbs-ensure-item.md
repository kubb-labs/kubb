---
'@kubb/core': patch
'@kubb/kit': patch
---

Rename the `Storage` and `NodeCache` methods to Node's filesystem vocabulary, and rename `getOrSet` to `ensureItem`.

`getOrSet` on `NodeCache` named its implementation rather than what a caller wants. It is now `ensureItem`, after fs-extra's `ensureFile` and `ensureDir`: return what is stored under the key, computing and storing it first when nothing is there. The rest of the surface moves to matching fs verbs.

| Before                 | After        |
| ---------------------- | ------------ |
| `hasItem`              | `existsItem` |
| `getItem`              | `readItem`   |
| `setItem`              | `writeItem`  |
| `getKeys`              | `readKeys`   |
| `clear`                | `empty`      |
| `getOrSet` (NodeCache) | `ensureItem` |

`removeItem` keeps its name, since it already matches `fs.rm`.

```ts
const imports = ctx.cache.ensureItem('plugin-ts:imports', () => ctx.resolver.imports({ node, root, output }))
```

`ensureItem` lands on `NodeCache` only. `Storage` does not get one: read-through makes sense for a per-node memo, but on a code generator's output it would mean an already-written file is never regenerated, which is the opposite of what a generate pass should do. `fsStorage` already skips a write when the content on disk is identical, so the cost `ensureItem` would save is not there to begin with.
