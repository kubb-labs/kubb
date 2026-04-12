# Step 2: Generators Registered via `addGenerator()` in Setup Event

## Goal

Move generator registration from external wiring (`getPreset` / `mergeGenerators` in the plugin body) to the `kubb:setup` event via `addGenerator()`. The framework manages generator execution order and merging. Generators are invoked during the build loop via `events.emit('kubb:generate:schema', ...)` and `events.emit('kubb:generate:operation', ...)`.

## Depends On

- Step 1 (`definePlugin` with `KubbEvents` + `events.emit` dispatch)

## Scope

- `packages/core/src/Kubb.ts` — extend `KubbEvents` with `kubb:generate:schema`, `kubb:generate:operation`, `kubb:generate:done`
- `packages/core/src/PluginDriver.ts` — generator storage per plugin, execution loop
- `packages/core/src/build.ts` — emit generator events during AST walk
- `packages/core/src/defineGenerator.ts` — no API change, but `mergeGenerators` becomes internal

## What Changes

### Extend `KubbEvents` with generator events

```ts
// packages/core/src/Kubb.ts — additions
export interface KubbEvents {
  // ... existing events ...
  // ... lifecycle events from Step 1 ...

  // Generator events (emitted during AST walk)
  'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
  'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
  'kubb:generate:done': [ctx: GeneratorDoneContext]
}
```

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

    // Register generator handlers on the event emitter
    if (generator.schema) {
      this.events.on('kubb:generate:schema', (node, ctx) =>
        generator.schema!(node, ctx)
      )
    }
    if (generator.operation) {
      this.events.on('kubb:generate:operation', (node, ctx) =>
        generator.operation!(node, ctx)
      )
    }
  }

  getGenerators(pluginName: string): Generator[] {
    return this.#generators.get(pluginName) ?? []
  }
}
```

### Build loop emits generator events

```ts
// packages/core/src/build.ts — simplified

for (const plugin of sortedPlugins) {
  // Walk AST nodes — emit events, all registered generators respond
  for (const schemaNode of inputNode.schemas) {
    await events.emit('kubb:generate:schema', schemaNode, generatorContext)
  }

  for (const operationNode of inputNode.operations) {
    await events.emit('kubb:generate:operation', operationNode, generatorContext)
  }

  // Signal that all nodes have been processed
  await events.emit('kubb:generate:done', generatorDoneContext)
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
- [ ] `addGenerator()` in `kubb:setup` delegates to `registerGenerator()` which registers on event emitter
- [ ] Build loop emits `kubb:generate:schema` / `kubb:generate:operation` events; registered generators respond
- [ ] Generator renderer fallback works: `generator.renderer ?? plugin.renderer`
- [ ] `mergeGenerators` marked as `@internal` with deprecation jsdoc
- [ ] External tooling can listen to `events.on('kubb:generate:schema', ...)` for debugging
- [ ] Existing tests pass unchanged

## Test Plan

1. Add unit test: `addGenerator()` registers generators; `getGenerators()` returns them
2. Add unit test: `events.emit('kubb:generate:schema', node, ctx)` calls registered generator's `schema()`
3. Add unit test: multiple generators registered for same plugin all receive emitted events
4. Add integration test: `definePlugin` with `addGenerator()` produces correct output files
5. All existing tests remain green

## Size Estimate

~150-200 lines changed in core (PluginDriver + build.ts + Kubb.ts). No plugin changes.
