---
"@kubb/plugin-oas": minor
"@kubb/plugin-ts": minor
---

feat(plugin-ts): add `integerType` option to control int64 TypeScript type

Adds an `integerType` option to `plugin-ts` (and the underlying `SchemaGeneratorOptions`) that controls how OpenAPI `integer` fields with `format: int64` are mapped to TypeScript types.

- `'bigint'` (default, existing behavior) — uses the TypeScript `bigint` type, accurate for values exceeding `Number.MAX_SAFE_INTEGER`.
- `'number'` — uses the TypeScript `number` type, matching the runtime behavior of `JSON.parse()`.

```typescript
pluginTs({
  integerType: 'number', // 'number' | 'bigint', default: 'bigint'
})
```
