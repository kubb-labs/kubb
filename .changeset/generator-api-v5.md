---
'@kubb/core': minor
'@kubb/plugin-ts': patch
'@kubb/plugin-zod': patch
'@kubb/plugin-client': patch
'@kubb/plugin-cypress': patch
'@kubb/plugin-mcp': patch
'@kubb/plugin-redoc': patch
'@kubb/plugin-faker': patch
'@kubb/plugin-msw': patch
'@kubb/plugin-react-query': patch
'@kubb/plugin-solid-query': patch
'@kubb/plugin-svelte-query': patch
'@kubb/plugin-vue-query': patch
'@kubb/plugin-swr': patch
'@kubb/plugin-oas': patch
---

## Generator API v5

### New: `GeneratorContext<TOptions>`

Generators now receive a typed `this` context that guarantees `adapter` and `rootNode` are always present (non-optional). Use it instead of the raw `PluginContext` to avoid null-checks in every hook:

```ts
import { defineGenerator } from '@kubb/core'

export const myGenerator = defineGenerator<PluginMyPlugin>({
  async schema(node, options) {
    const { adapter, rootNode } = this  // always present, no null-check needed
    // ...
  },
})
```

### New: `mergeGenerators(generators)`

Combines an array of generators into a single merged generator. Each hook runs in sequence and applies its result via `applyHookResult`. Use this inside plugin hooks to delegate to all generators in the preset:

```ts
import { mergeGenerators } from '@kubb/core'

export const myPlugin = createPlugin<MyPlugin>((options) => {
  const generators = [generatorA, generatorB]
  const mergedGenerator = mergeGenerators(generators)

  return {
    name: 'my-plugin',
    async schema(node, opts) {
      return mergedGenerator.schema?.call(this, node, opts)
    },
    async operation(node, opts) {
      return mergedGenerator.operation?.call(this, node, opts)
    },
    async operations(nodes, opts) {
      return mergedGenerator.operations?.call(this, nodes, opts)
    },
  }
})
```

### New: `PluginBaseOptions<TResolvedOptions>`

All plugin `Options` types now extend `PluginBaseOptions` which provides the standard fields out of the box:

- `output?: Output` — output path and barrel configuration
- `exclude?: Array<Exclude>` — patterns to exclude from generation
- `include?: Array<Include>` — patterns to restrict generation to
- `override?: Array<Override<TResolvedOptions>>` — per-file option overrides

### New: `PluginRegistry` augmentation

Every plugin now augments the global `Kubb.PluginRegistry` interface, enabling automatic typing for `getPlugin` and `requirePlugin`:

```ts
const tsPlugin = context.getPlugin('plugin-ts')
// tsPlugin is typed as PluginTs automatically
```

### New: `version` field on plugins

All plugins now expose their package version via the `version` field on the plugin object. This is used in diagnostic messages and version-conflict detection.

### Renamed: `renderHookResult` → `applyHookResult`

The internal helper for dispatching generator return values has been renamed to better reflect its purpose. If you were importing it directly, update your imports.
