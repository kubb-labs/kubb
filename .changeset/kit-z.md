---
'@kubb/kit': patch
---

`@kubb/kit` exports `z`: Zod 4 plus the Kubb option helpers, such as `z.suggest()`, `z.when()`, and `z.outputOptionsSchema`. Extensions write their options schema with it and need no `zod` dependency of their own. `zod` is now a dependency of `@kubb/kit`, and the `@kubb/kit/options` entry is replaced by `z`.

```ts
import { z } from 'kubb/kit'

const optionsSchema = z.outputOptionsSchema.extend({
  importPath: z.suggest(['zod', 'zod/mini']).optional(),
})
```
