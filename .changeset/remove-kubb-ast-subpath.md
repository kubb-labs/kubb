---
'kubb': major
---

Remove the `kubb/ast` subpath. Reach the AST through the `ast` namespace from `kubb/kit`, and install `@kubb/ast` when you want the AST on its own.

```diff
- import { extractRefName, walk } from 'kubb/ast'
+ import { ast } from 'kubb/kit'
+ // ast.extractRefName(...), ast.walk(...)
```
