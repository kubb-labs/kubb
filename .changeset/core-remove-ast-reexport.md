---
'@kubb/core': major
---

Remove the `ast` re-export from `@kubb/core`. Import it from `@kubb/ast` instead (or `kubb/kit`, which re-exports it alongside the rest of the authoring toolkit).

```diff
- import { ast } from '@kubb/core'
+ import { ast } from '@kubb/ast'
```
