---
'@kubb/kit': minor
'kubb': minor
---

Add `kubb/kit/options`, a set of Zod schemas for the options most plugins share, so a plugin describes `output`, `group`, `include`, `exclude`, `override`, `resolver`, and `macros` once instead of copying the types.

- `outputOptionsSchema` holds `output` and `group`, and rejects `group` when `output.mode` resolves to `'file'`. `outputSchema`, `groupSchema`, `filterSchema`, `includeSchema`, `excludeSchema`, and `macrosSchema` cover the single options. `overrideSchema(optionsSchema)` and `resolverSchema<T>()` build the plugin-specific ones.
- `suggest(values)` accepts any string, while its type autocompletes the listed values. JSON Schema lists them under `x-kubb-values`.
- `when(condition)` returns `x-kubb-when` metadata, so an option shows only when other options match.
- `.meta()` accepts typed `x-kubb-when` and `x-kubb-values` keys.

`zod` 4 is an optional peer dependency. The main `kubb/kit` import does not load it.

```ts
import * as z from 'zod'
import { excludeSchema, outputOptionsSchema, overrideSchema, suggest, when } from 'kubb/kit/options'

const baseSchema = outputOptionsSchema.extend({
  exclude: excludeSchema.optional(),
  importPath: suggest(['zod', 'zod/mini']).optional(),
  enumType: z.enum(['asConst', 'enum']).optional(),
  constCasing: z
    .enum(['camelCase', 'PascalCase'])
    .meta(when({ enumType: 'asConst' }))
    .optional(),
})

export const optionsSchema = baseSchema.extend({
  override: overrideSchema(baseSchema).optional(),
})
```
