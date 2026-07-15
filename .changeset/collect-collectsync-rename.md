---
'@kubb/ast': major
'@kubb/core': patch
'@kubb/adapter-oas': patch
'@kubb/kit': patch
---

Rename `@kubb/ast`'s collection passes: the lazy generator `collectLazy` is now `collect`, and the eager array form (previously `collect`) is now `collectSync`.

```diff
- import { collect } from '@kubb/ast'
- const types = collect<string>(root, { schema: (n) => n.type })
+ import { collectSync } from '@kubb/ast'
+ const types = collectSync<string>(root, { schema: (n) => n.type })

- import { collectLazy } from '@kubb/ast'
- for (const id of collectLazy<string>(root, { operation: (n) => n.operationId })) { ... }
+ import { collect } from '@kubb/ast'
+ for (const id of collect<string>(root, { operation: (n) => n.operationId })) { ... }
```
