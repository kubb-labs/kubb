---
'@kubb/core': minor
---

Accept a resolver built with `createResolver` wherever a plugin `resolver` override is expected.

`setResolver` now takes `ResolverOverride<T>`, the union of a `ResolverPatch` (the partial params you pass to `createResolver`) and a full resolver returned by `createResolver`. Build the override once and hand it over:

```ts
import { createResolver } from 'kubb/kit'

ctx.setResolver(
  createResolver<PluginFaker>({
    pluginName: 'plugin-faker',
    name(name) {
      return `${name}Faker`
    },
  }),
)
```

The plain params object keeps working, so `setResolver({ name(name) { … } })` is unchanged.
