---
'@kubb/core': minor
---

Add typed generator context and lifecycle hooks.

### `GeneratorContext<TOptions>`

Generators now receive a typed `this` context where `adapter` and `rootNode` are always present:

```ts
export const myGenerator = defineGenerator<PluginMyPlugin>({
  async schema(node, options) {
    const { adapter, rootNode } = this // always present
  },
})
```

### `mergeGenerators(generators)`

Combine multiple generators into one. Each hook runs in sequence:

```ts
const mergedGenerator = mergeGenerators([generatorA, generatorB])
```

### `PluginRegistry` augmentation

Plugins now augment `Kubb.PluginRegistry` for automatic typing in `getPlugin`:

```ts
const tsPlugin = context.getPlugin('plugin-ts') // typed as PluginTs
```

### Renamed hooks

- `renderHookResult` → `applyHookResult`
- `install` → `buildStart`
- New `buildEnd` hook runs after all files are written
