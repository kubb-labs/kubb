---
'@kubb/plugin-client': minor
---

Add support for class-based client generation via the new `clientType` option. Users can now generate API clients as classes with methods instead of standalone functions by setting `clientType: 'class'` in the plugin configuration.

Example usage:
```ts
pluginClient({
  output: {
    path: './clients/class',
  },
  clientType: 'class',
  group: {
    type: 'tag',
  },
})
```

This will generate classes like `Pet`, `Store`, `User` with methods for each operation.
