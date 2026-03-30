---
"@kubb/plugin-zod": minor
"@kubb/ast": patch
---

### `@kubb/plugin-zod` — v5 architecture rewrite

Complete rewrite of `@kubb/plugin-zod` to the v5 AST-based architecture. The plugin no longer depends on `@kubb/plugin-oas` or `@kubb/oas`; it operates entirely on the `@kubb/ast` node graph.

**Breaking changes:**

- `mapper` option removed — no replacement (naming is now controlled via `resolvers`)
- `version` option removed — Zod v3 is no longer supported; Kubb v5 always generates Zod v4 code
- `contentType` option removed — moved to `adapterOas(...)`
- `transformers.name` callback removed — use the `resolvers` array for name customization
- `transformers.schema` callback removed — use `transformers: Array<Visitor>` for AST transformations
- `integerType` option removed — moved to `adapterOas({ integerType })` (default: `'bigint'`). Previously, the v4 default was `'number'`; if you relied on that, set `integerType: 'number'` in `adapterOas(...)`.
- `emptySchemaType` option removed — moved to `adapterOas({ emptySchemaType })`
- `unknownType` option removed — moved to `adapterOas({ unknownType })`
- `wrapOutput` callback signature changed: `schema` argument is now `SchemaNode` (from `@kubb/ast/types`) instead of `SchemaObject` (from `@kubb/oas`)
- `coercion` now accepts a granular object `{ dates?, strings?, numbers? }` in addition to `boolean`
- Naming conventions (default preset): response status schemas are now named `<operationId>Status<code>Schema` instead of `<operationId><code>Schema`. Use `compatibilityPreset: 'kubbV4'` to keep the old names.

**New options:**
- `paramsCasing?: 'camelcase'` — apply camelCase to path/query/header parameter names in operation schemas
- `compatibilityPreset?: 'default' | 'kubbV4'` — select naming conventions; `'kubbV4'` reproduces Kubb v4 names for a gradual migration
- `resolvers?: Array<ResolverZod>` — provide custom resolver instances to override naming conventions
- `transformers?: Array<Visitor>` — AST visitor array applied to each `SchemaNode` before printing (replaces the old `transformers.schema` callback)

**New exports:**

- `resolverZod` — default v5 resolver (camelCase + `Schema` suffix)
- `resolverZodLegacy` — Kubb v4-compatible resolver (use with `compatibilityPreset: 'kubbV4'`)
- `printerZod` — Zod v4 chainable-API printer factory (`definePrinter`)
- `printerZodMini` — Zod v4 Mini functional-API printer factory

### `@kubb/ast`

- `createSchema`, `createProperty`, `createOperation` factory functions now automatically infer and set the `primitive` field based on the node `type`, reducing boilerplate in tests and custom generators.
