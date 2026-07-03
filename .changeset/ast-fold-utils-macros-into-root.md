---
'@kubb/ast': major
---

Fold the `@kubb/ast/utils` and `@kubb/ast/macros` subpaths into the root `@kubb/ast` export and remove both subpaths.

```diff
- import { extractRefName, syncSchemaRef } from '@kubb/ast/utils'
+ import { extractRefName, syncSchemaRef } from '@kubb/ast'

- import { macroSimplifyUnion } from '@kubb/ast/macros'
+ import { macroSimplifyUnion } from '@kubb/ast'
```

`@kubb/ast/types` is unaffected.
