---
'@kubb/core': minor
---

Merge a plugin `resolver` override per method, so a patch can change one namespace method and keep the rest.

`ResolverPatch` accepts a partial namespace now, and `Resolver.merge` merges each namespace method over the plugin defaults instead of replacing the whole namespace. Override `query.name` and `query.keyName` still resolves through the plugin default. `this` stays typed as the full resolver, so an override reaches `this.name`, `this.file`, and its sibling helpers:

```ts
pluginReactQuery({
  resolver: {
    query: {
      name(node) {
        return `use${capitalize(this.name(node.operationId))}Hook`
      },
    },
  },
})
```

The `resolver` option only patches an existing resolver. Build a whole new one in a custom plugin.
