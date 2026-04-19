---
'@kubb/ast': minor
'@kubb/adapter-oas': minor
'@kubb/core': patch
---

Add type helper nodes and options.

### `@kubb/ast`

- Add `never` to `PrimitiveSchemaType`
- Add `UrlSchemaNode` with Express-style `path` field
- Add `applyParamsCasing` helper

### `@kubb/adapter-oas`

- Add `unknownType` and `emptySchemaType` options to `convertSchema`
- Add `url` special-type handling in the parser

### `@kubb/core`

- `OverrideItem.options` typed as `Omit<Partial<TOptions>, 'override'>` to prevent recursive overrides
