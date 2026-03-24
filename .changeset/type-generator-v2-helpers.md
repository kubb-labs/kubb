---
"@kubb/ast": minor
"@kubb/adapter-oas": minor
"@kubb/core": patch
"@kubb/plugin-ts": minor
---

- **`@kubb/ast`**: Add `never` to `PrimitiveSchemaType`, `UrlSchemaNode` with Express-style `path` field, and `applyParamsCasing` helper.
- **`@kubb/adapter-oas`**: Add `unknownType` and `emptySchemaType` options to `convertSchema`. Add `url` special-type handling in the parser.
- **`@kubb/core`**: `OverrideItem.options` is typed as `Omit<Partial<TOptions>, 'override'>` to prevent recursive overrides.
- **`@kubb/plugin-ts`**: Add `buildDataSchemaNode`, `buildParamsSchema`, `buildResponsesSchemaNode`, `buildResponseUnionSchemaNode`. Printer handles `never`. Add `src/constants.ts` with `OPTIONAL_ADDS_UNDEFINED`, `OPTIONAL_ADDS_QUESTION_TOKEN`, `ENUM_TYPES_WITH_KEY_SUFFIX`.
