# Step 2: Generators Registered via `addGenerator()` in Setup Event

## Goal

Move generator registration from external wiring (`getPreset` / `mergeGenerators` in the plugin body) to the `kubb:setup` event via `addGenerator()`. The framework manages generator execution, renderer resolution, and result handling. Generators are invoked during the build loop via `events.emit('kubb:generate:schema', ...)`, `events.emit('kubb:generate:operation', ...)`, and `events.emit('kubb:generate:done', ...)`.

## Depends On

- Step 1 (`definePlugin` with `KubbEvents` + `events.emit` dispatch)

## Scope

- `packages/core/src/Kubb.ts` — extend `KubbEvents` with `kubb:generate:schema`, `kubb:generate:operation`, `kubb:generate:done`
- `packages/core/src/PluginDriver.ts` — generator storage per plugin, `registerGenerator()`, renderer resolution, `applyHookResult` integration
- `packages/core/src/build.ts` — AST walk emits generator events, operations collection
- `packages/core/src/defineGenerator.ts` — no API change, but `mergeGenerators` becomes internal

## What Changes

### The `Generator` type

The existing `Generator` type defines a named object with optional `schema()`, `operation()`, and `operations()` methods. Each method receives a node and context parameters. The type is **unchanged** — the only difference is that in the new model, `this` context is replaced by the `ctx` parameter (see Step 4).

```ts
// packages/core/src/defineGenerator.ts — existing type (unchanged)
export type Generator<TOptions extends PluginFactoryOptions = PluginFactoryOptions, TElement = unknown> = {
  name: string
  renderer?: RendererFactory<TElement> | null
  schema?: (this: GeneratorContext<TOptions>, node: SchemaNode, options: TOptions['resolvedOptions']) =>
    PossiblePromise<TElement | Array<FileNode> | void>
  operation?: (this: GeneratorContext<TOptions>, node: OperationNode, options: TOptions['resolvedOptions']) =>
    PossiblePromise<TElement | Array<FileNode> | void>
  operations?: (this: GeneratorContext<TOptions>, nodes: Array<OperationNode>, options: TOptions['resolvedOptions']) =>
    PossiblePromise<TElement | Array<FileNode> | void>
}
```

Key design points:
- **`schema()`** — called per schema node during AST walk
- **`operation()`** — called per operation node during AST walk
- **`operations()`** — called **once** after all operations, with the collected array (used for barrel files, operation maps, etc.)
- **`renderer`** — optional renderer factory; `null` explicitly opts out, `undefined` falls through to plugin/config renderer
- Return values: renderer elements (e.g. JSX), `FileNode[]`, or `void` (manual file handling)

### The `GeneratorContext` type

`GeneratorContext` is the `this` context (current) / parameter context (new) that generators receive. It extends `PluginContext` with adapter and input node guaranteed present:

```ts
// packages/core/src/types.ts
export type GeneratorContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = PluginContext<TOptions> & {
  adapter: Adapter
  inputNode: InputNode
}
```

In the new event model, this context is built by the framework and passed as a parameter to generator methods via `events.emit`.

### Extend `KubbEvents` with generator events

```ts
// packages/core/src/Kubb.ts — additions
export interface KubbEvents {
  // ... existing events (lifecycle:start, plugin:start, etc.) ...
  // ... lifecycle events from Step 1 (kubb:setup, kubb:build:start, kubb:build:done) ...

  // Generator events (emitted during AST walk)
  'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext, options: ResolvedOptions]
  'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext, options: ResolvedOptions]
  'kubb:generate:done': [nodes: Array<OperationNode>, ctx: GeneratorContext, options: ResolvedOptions]
}
```

### PluginDriver: generator storage and renderer resolution

```ts
// packages/core/src/PluginDriver.ts

class PluginDriver {
  // New: per-plugin generator registry
  #generators = new Map<string, Generator[]>()

  /**
   * Register a generator for a plugin. Called by `addGenerator()` in the
   * `kubb:setup` event context. Each generator's handlers are registered
   * as listeners on the event emitter for the corresponding event.
   */
  registerGenerator(pluginName: string, plugin: Plugin, generator: Generator) {
    const list = this.#generators.get(pluginName) ?? []
    list.push(generator)
    this.#generators.set(pluginName, list)

    /**
     * Resolve the effective renderer for this generator following the precedence chain:
     * `generator.renderer` → `plugin.renderer` → `config.renderer` → `undefined` (raw FileNode[] mode).
     * - `null`  → explicitly no renderer (ignores all fallbacks)
     * - `undefined` → fall through to plugin, then config renderer
     */
    const resolveRenderer = (): RendererFactory | undefined => {
      return generator.renderer === null
        ? undefined
        : (generator.renderer ?? plugin.renderer ?? this.config.renderer)
    }

    // Register schema handler
    if (generator.schema) {
      this.events.on('kubb:generate:schema', async (node, ctx, options) => {
        const result = await generator.schema!.call(ctx, node, options)
        await applyHookResult(result, this, resolveRenderer())
      })
    }

    // Register operation handler
    if (generator.operation) {
      this.events.on('kubb:generate:operation', async (node, ctx, options) => {
        const result = await generator.operation!.call(ctx, node, options)
        await applyHookResult(result, this, resolveRenderer())
      })
    }

    // Register operations (batch) handler — called via kubb:generate:done
    if (generator.operations) {
      this.events.on('kubb:generate:done', async (nodes, ctx, options) => {
        const result = await generator.operations!.call(ctx, nodes, options)
        await applyHookResult(result, this, resolveRenderer())
      })
    }
  }

  getGenerators(pluginName: string): Generator[] {
    return this.#generators.get(pluginName) ?? []
  }
}
```

### Result handling via `applyHookResult`

Generator methods return one of three types. `applyHookResult` handles all three uniformly:

```ts
// packages/core/src/renderNode.ts — existing, unchanged
async function applyHookResult(
  result: TElement | Array<FileNode> | void,
  driver: PluginDriver,
  renderer?: RendererFactory
): Promise<void> {
  if (result === undefined || result === null) return            // void — plugin handled files manually
  if (Array.isArray(result)) {                                   // FileNode[] — write directly
    for (const file of result) driver.fileManager.upsertFile(file)
    return
  }
  if (renderer) {                                                // Renderer element (e.g. JSX)
    const rendered = renderer.create().render(result)            // → Array<FileNode>
    for (const file of rendered) driver.fileManager.upsertFile(file)
    return
  }
  throw new Error('Generator returned a renderer element but no renderer is configured')
}
```

### Build loop: AST walk emits generator events

The build loop replaces the current direct `gen.schema.call(context, ...)` pattern with `events.emit(...)`. Node transformation, options resolution, and the `operations()` batch call are all preserved:

```ts
// packages/core/src/build.ts — per-plugin AST walk (simplified)

async function runPluginAstHooks(plugin: Plugin, context: PluginContext): Promise<void> {
  const { adapter, inputNode, resolver } = context
  const { exclude, include, override } = plugin.options
  const collectedOperations: Array<OperationNode> = []

  // Walk the AST — emit events for each node
  await walk(inputNode, {
    depth: 'shallow',

    async schema(node) {
      // Apply transformer if configured
      const transformedNode = plugin.transformer
        ? transform(node, plugin.transformer)
        : node

      // Resolve per-node options (respects exclude/include/override)
      const options = resolver.resolveOptions(transformedNode, {
        options: plugin.options, exclude, include, override,
      })
      if (options === null) return  // excluded by config

      // Emit — all generators registered for this plugin respond
      await events.emit('kubb:generate:schema', transformedNode, context, options)
    },

    async operation(node) {
      const transformedNode = plugin.transformer
        ? transform(node, plugin.transformer)
        : node

      const options = resolver.resolveOptions(transformedNode, {
        options: plugin.options, exclude, include, override,
      })
      if (options === null) return

      collectedOperations.push(transformedNode)
      await events.emit('kubb:generate:operation', transformedNode, context, options)
    },
  })

  // After all operations: emit kubb:generate:done for batch handlers (operations())
  if (collectedOperations.length > 0) {
    await events.emit('kubb:generate:done', collectedOperations, context, plugin.options)
  }
}
```

### The `addGenerator()` context utility

In the `kubb:setup` event, `addGenerator()` is provided as a context utility. It delegates to `PluginDriver.registerGenerator()`:

```ts
// packages/core/src/PluginDriver.ts — inside kubb:setup context factory

function createSetupContext(plugin: HookStylePlugin, driver: PluginDriver): KubbSetupContext {
  return {
    addGenerator(generator: Generator) {
      driver.registerGenerator(plugin.name, plugin, generator)
    },
    setResolver(overrides) { /* ... (Step 3) */ },
    setRenderer(renderer) { /* ... */ },
    setTransformer(transformer) { /* ... */ },
    logger: driver.logger,
    // ...
  }
}
```

### `mergeGenerators` becomes internal

The current public `mergeGenerators` function is no longer needed for the new API — the framework handles generator merging through the event emitter pattern. It remains exported for backward compatibility during migration but is marked as `@internal`.

### Example: `defineGenerator` objects (unchanged)

Existing `defineGenerator` objects work as-is with `addGenerator()`:

```ts
// packages/plugin-ts/src/generators/typeGenerator.tsx — unchanged
export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript-types',
  renderer: jsxRenderer,
  schema(node, options) {
    // `this` is GeneratorContext<PluginTs> (unchanged until Step 4)
    const file = this.resolver.file({ name: node.name, extname: '.ts' })
    return <File baseName={file.baseName} path={file.path}>...</File>
  },
  operation(node, options) {
    return <File ...>...</File>
  },
})
```

### Example: plugin-ts in new style

```ts
// What a migrated plugin-ts would look like (not changed in this step)
export const pluginTs = definePlugin<PluginTs>((options = {}) => ({
  name: 'plugin-ts',
  hooks: {
    'kubb:setup'({ addGenerator, setResolver, setRenderer }) {
      setRenderer(jsxRenderer)
      setResolver({
        name: (name, type) => type === 'type' ? pascalCase(name) : camelCase(name),
      })

      // Register generators — framework handles execution order,
      // renderer resolution, and applyHookResult
      addGenerator(typeGenerator)
      addGenerator(enumGenerator)

      // Conditional generators (replaces preset if/else)
      if (options.oasType === 'inferred') {
        addGenerator(inferredTypeGenerator)
      }
    },
    'kubb:build:done'({ files, logger }) {
      logger.info(`Generated ${files.length} TypeScript files`)
    },
  },
}))
```

### Example: inline generator (no separate file needed)

For simple plugins, generators can be defined inline:

```ts
export const pluginHello = definePlugin((options = {}) => ({
  name: 'plugin-hello',
  hooks: {
    'kubb:setup'({ addGenerator }) {
      addGenerator({
        name: 'hello',
        schema(node, options) {
          const content = `// Hello from ${node.name}\nexport type ${node.name} = unknown\n`
          return [{ baseName: `${node.name}.ts`, path: `./gen/${node.name}.ts`, source: content }]
        },
      })
    },
  },
}))
```

### Example: multiple generators with different renderers

Generators can override the plugin-level renderer:

```ts
'kubb:setup'({ addGenerator, setRenderer }) {
  setRenderer(jsxRenderer)  // default for all generators

  addGenerator({
    name: 'types',
    // Uses jsxRenderer (from plugin)
    schema(node, options) { return <TypeFile node={node} /> },
  })

  addGenerator({
    name: 'barrel',
    renderer: null,  // Explicitly opt out — returns FileNode[] directly
    operations(nodes, options) {
      return [{ baseName: 'index.ts', path: './gen/index.ts', source: barrelSource(nodes) }]
    },
  })

  addGenerator({
    name: 'docs',
    renderer: handlebarsRenderer,  // Override with different renderer
    schema(node, options) { return docsTemplate({ name: node.name }) },
  })
}
```

## What Does NOT Change

- `defineGenerator` API — unchanged
- Generator type (`{ name, renderer?, schema(), operation(), operations() }`) — unchanged
- `applyHookResult` behavior — unchanged (renderer elements, FileNode[], void)
- `createPlugin` plugins — still work with their own generator wiring
- Existing plugins — not migrated in this step

## Acceptance Criteria

- [ ] `PluginDriver.registerGenerator()` stores generators per plugin and registers handlers on event emitter
- [ ] `addGenerator()` in `kubb:setup` delegates to `registerGenerator()`
- [ ] Build loop emits `kubb:generate:schema` / `kubb:generate:operation` / `kubb:generate:done` events via `events.emit()`
- [ ] Registered generator `schema()`, `operation()`, `operations()` handlers respond to emitted events
- [ ] Renderer resolution chain works: `generator.renderer → plugin.renderer → config.renderer`
- [ ] `applyHookResult` handles all three return types (renderer elements, FileNode[], void)
- [ ] Node transformation (`plugin.transformer`) applied before emitting events
- [ ] Options resolution (`resolver.resolveOptions` with exclude/include/override) works per-node
- [ ] `operations()` batch handler receives collected operations after walk completes
- [ ] `mergeGenerators` marked as `@internal` with deprecation jsdoc
- [ ] External tooling can listen to `events.on('kubb:generate:schema', ...)` for debugging
- [ ] Existing tests pass unchanged

## Test Plan

1. Add unit test: `addGenerator()` registers generators; `getGenerators()` returns them
2. Add unit test: `events.emit('kubb:generate:schema', node, ctx, opts)` calls registered generator's `schema()` with correct arguments
3. Add unit test: `events.emit('kubb:generate:operation', node, ctx, opts)` calls `operation()` handler
4. Add unit test: `events.emit('kubb:generate:done', nodes, ctx, opts)` calls `operations()` batch handler with collected nodes
5. Add unit test: multiple generators registered for same plugin all receive emitted events
6. Add unit test: renderer resolution chain — generator-level overrides plugin-level, `null` disables
7. Add unit test: `applyHookResult` handles JSX elements → rendered FileNode[], raw FileNode[], and void correctly
8. Add unit test: excluded nodes (via `resolver.resolveOptions`) are not emitted
9. Add unit test: transformer is applied before event emission
10. Add integration test: `definePlugin` with `addGenerator()` produces correct output files
11. All existing tests remain green

## Size Estimate

~200-250 lines changed in core (PluginDriver + build.ts + Kubb.ts). No plugin changes.
