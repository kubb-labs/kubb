---
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/core": patch
"@kubb/plugin-ts": minor
---

- **`@kubb/ast`**: Added `never` to `PrimitiveSchemaType` and `SchemaNodeByType`. Added `UrlSchemaNode` type with optional `path` field for Express-style template literal generation. Excluded `url` from `ScalarSchemaType`. Added `applyParamsCasing` helper to transform parameter names before schema building.
- **`@kubb/adapter-oas`**: Added `unknownType` and `emptySchemaType` options to `convertSchema` so callers can control the type emitted for empty or untyped schemas. Added `url` special-type handling in the parser.
- **`@kubb/core`**: `resolveOptions` now prevents recursive overrides by typing `OverrideItem.options` as `Omit<Partial<TOptions>, 'override'>`.
- **`@kubb/plugin-ts`**: New v2 schema-builder utilities — `buildDataSchemaNode`, `buildParamsSchema`, `buildResponsesSchemaNode`, and `buildResponseUnionSchemaNode` — for generating typed `Data`, `Responses`, and `Response` types from an `OperationNode`. The printer now handles the `never` schema type.
