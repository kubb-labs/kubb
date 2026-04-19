---
"@kubb/core": minor
---

`getResolver` is now typed based on `pluginName` via `Kubb.PluginRegistry`.

### `PluginDriver.getResolver` overloads

Calling `getResolver` with a registered plugin name returns the plugin-specific resolver type instead of the generic `Resolver`:

```ts
// before – always returned the base Resolver type
const resolver = driver.getResolver("@kubb/plugin-ts"); // Resolver

// after – returns the plugin's typed resolver
const resolver = driver.getResolver("@kubb/plugin-ts"); // PluginTs['resolver']
```

### `GeneratorContext.getResolver`

The same typed overloads are now available inside generators via `ctx.getResolver`:

```ts
export const myGenerator = defineGenerator<PluginMyPlugin>({
  async schema(node, ctx) {
    const tsResolver = ctx.getResolver("@kubb/plugin-ts"); // PluginTs['resolver']
  },
});
```
