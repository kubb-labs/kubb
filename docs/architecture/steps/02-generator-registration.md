# Step 2: Generators Registered via `addGenerator()` in Setup Hook

## Goal

Move generator registration from external wiring (`getPreset` / `mergeGenerators` in the plugin body) to the `kubb:setup` hook via `addGenerator()`. The framework manages generator execution order and merging.

## Depends On

- Step 1 (`definePlugin` with hooks)

## Scope

- `packages/core/src/PluginDriver.ts` — generator storage per plugin, execution loop
- `packages/core/src/build.ts` — call registered generators during AST walk
- `packages/core/src/defineGenerator.ts` — no API change, but `mergeGenerators` becomes internal

## What Changes

### PluginDriver stores generators per plugin

```ts
// packages/core/src/PluginDriver.ts

class PluginDriver {
  // New: per-plugin generator registry
  #generators = new Map<string, Generator[]>()

  registerGenerator(pluginName: string, generator: Generator) {
    const list = this.#generators.get(pluginName) ?? []
    list.push(generator)
    this.#generators.set(pluginName, list)
  }

  getGenerators(pluginName: string): Generator[] {
    return this.#generators.get(pluginName) ?? []
  }
}
```

### Build loop calls registered generators

```ts
// packages/core/src/build.ts — simplified

for (const plugin of sortedPlugins) {
  const generators = driver.getGenerators(plugin.name)
  
  for (const generator of generators) {
    // Walk AST nodes
    for (const schemaNode of inputNode.schemas) {
      const result = await generator.schema?.(schemaNode, generatorContext)
      await applyHookResult(result, driver, generator.renderer ?? plugin.renderer)
    }
    
    for (const operationNode of inputNode.operations) {
      const result = await generator.operation?.(operationNode, generatorContext)
      await applyHookResult(result, driver, generator.renderer ?? plugin.renderer)
    }
    
    // operations() called once with all operation nodes
    const result = await generator.operations?.(inputNode.operations, generatorContext)
    await applyHookResult(result, driver, generator.renderer ?? plugin.renderer)
  }
}
```

### `mergeGenerators` becomes internal

The current public `mergeGenerators` function is no longer needed for the new API — the framework handles it. It remains exported for backward compatibility during migration but is marked as `@internal`.

### Example: plugin-ts in new style

```ts
// What a migrated plugin-ts would look like (not changed in this step)
export const pluginTs = definePlugin((options = {}) => ({
  name: 'plugin-ts',
  hooks: {
    'kubb:setup'({ addGenerator }) {
      addGenerator(typeGenerator)     // existing defineGenerator object
      addGenerator(enumGenerator)     // existing defineGenerator object
    },
  },
}))
```

## What Does NOT Change

- `defineGenerator` API — unchanged
- Generator objects (`{ name, schema(), operation(), operations() }`) — unchanged
- `createPlugin` plugins — still work with their own generator wiring
- Existing plugins — not migrated in this step

## Acceptance Criteria

- [ ] `PluginDriver.registerGenerator()` stores generators per plugin
- [ ] `addGenerator()` in `kubb:setup` delegates to `registerGenerator()`
- [ ] Build loop iterates registered generators and calls `schema()`/`operation()`/`operations()`
- [ ] Generator renderer fallback works: `generator.renderer ?? plugin.renderer`
- [ ] `mergeGenerators` marked as `@internal` with deprecation jsdoc
- [ ] Existing tests pass unchanged

## Test Plan

1. Add unit test: `addGenerator()` registers generators; `getGenerators()` returns them
2. Add unit test: build loop calls `schema()` on registered generator for each schema node
3. Add unit test: multiple generators registered for same plugin execute in order
4. Add integration test: `definePlugin` with `addGenerator()` produces correct output files
5. All existing tests remain green

## Size Estimate

~150-200 lines changed in core (PluginDriver + build.ts). No plugin changes.
