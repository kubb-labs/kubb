---
"@kubb/ast": minor
"@kubb/core": minor
---

Add `mergeResolvers(...resolvers)` to `@kubb/core` (last wins) and `composeTransformers(...visitors)` to `@kubb/ast` for combining multiple `Visitor` objects into a single sequential pipeline. `Resolver.name` is now required.
