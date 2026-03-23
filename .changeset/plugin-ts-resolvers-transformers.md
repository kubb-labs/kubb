---
"@kubb/ast": minor
"@kubb/core": minor
"@kubb/plugin-ts": minor
---

### `@kubb/core`

- Add `name: string` to the `Resolver` base type. Every resolver now carries a name that identifies it.
- `defineResolver` build functions must return a `name` property.
- Add `mergeResolvers(...resolvers)` helper that merges multiple resolvers into one (last wins).

### `@kubb/ast`

- Add `composeTransformers(...visitors)` helper that combines multiple `Visitor` objects into a single visitor. Each node kind is piped through all visitors sequentially (left to right).

### `@kubb/plugin-ts`

- Add `resolvers` option — an array of named resolvers that control naming conventions. Later entries override earlier ones. Built-in resolvers: `resolverTs` (default) and `resolverTsLegacy`.
- Add `transformers` option — an array of AST `Visitor` objects applied to each `SchemaNode` before printing. Uses `composeTransformers` + `transform` from `@kubb/ast`.
- Export `resolverTs`, `resolverTsLegacy`, and `ResolverTs` from the package root.
- Remove the old `transformers: { name? }` object option. Use a custom resolver in `resolvers` instead.
- Deprecate `legacy` option in favor of `resolvers: [resolverTsLegacy]`.
