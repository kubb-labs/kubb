---
'@kubb/middleware-barrel': minor
---

`getBarrelFiles` now returns a `Generator<FileNode>` instead of `Array<FileNode>`.

Iterate with `for...of` or spread into an array to preserve existing behavior:

```ts
// before
const files = getBarrelFiles({ ... })

// after: iterate incrementally
for (const file of getBarrelFiles({ ... })) { ... }

// after: spread to get an array
const files = [...getBarrelFiles({ ... })]
```
