---
"@kubb/ast": minor
"@kubb/core": minor
---

Add resolver and transformer composition helpers.

### `@kubb/core`

- `Resolver` base type now includes `name: string`
- `mergeResolvers(...resolvers)` combines multiple resolvers (last wins)

### `@kubb/ast`

- `composeTransformers(...visitors)` combines multiple `Visitor` objects into one, piping each node kind through all visitors sequentially
