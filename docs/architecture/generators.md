# Simplified Generators — Architecture Decision Record

## Status

Proposed

## Context

Kubb plugins generate files by walking a `RootNode` AST and mapping each `SchemaNode` or `OperationNode` to one or more output files. The code that performs this mapping lives in **generators** — objects that implement `schema`, `operation`, and `operations` methods.

The current generator API has accumulated significant friction as the plugin ecosystem has grown:

**`type: 'react' | 'core'` split.**
Every generator must declare whether it produces React elements (`type: 'react'`) or raw file arrays (`type: 'core'`). This forces the author to think about the output mechanism rather than the output content, and requires maintaining two separate type branches (`UserReactGeneratorV2` / `UserCoreGeneratorV2`) with different method signatures (capital `Schema/Operation/Operations` for React, lowercase for core).

**Prop drilling.**
Each generator method receives a large positional props object:

```ts
Schema({ node, adapter, options, config, resolver, plugin, driver }) { ... }
```

All of these values are already present on the `PluginContext` that owns the generator, yet they are threaded in explicitly on every call. Adding or accessing a new context value requires updating every generator signature.

**`version: '2'` noise.**
Generators carry a `version: '2'` discriminant that no consumer actually checks at runtime — it exists solely to distinguish from a now-defunct v1 shape.

**Inconsistency with direct plugin hooks.**
A plugin can declare `schema`/`operation`/`operations` methods directly for the simple single-handler case (inspired by Vite/Rollup plugin hooks). These direct hooks already use a cleaner `(node, options)` signature with `this: PluginContext`. Generators should use the same contract.

**Duplicate rendering helpers.**
`renderNode.tsx` contains `renderSchema`, `renderOperation`, `renderOperations`, `runGeneratorSchema`, `runGeneratorOperation`, `runGeneratorOperations`, and four accompanying prop types. All of these do the same thing as `renderHookResult` — take a React element or `File[]` and write it to the fabric — just through a more indirect code path.

## Decision

Adopt a single, unified `Generator<TOptions>` shape. Remove all type discrimination. Use `this: PluginContext<TOptions>` to replace prop drilling. Make the generator methods identical in signature to the direct plugin hooks.

### New `Generator` type

```ts
export type Generator<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /** Used in diagnostic messages and debug output. */
  name: string
  /**
   * Called for each schema node in the AST walk.
   * Return a React element, an array of FabricFile.File, or void to handle manually.
   * `this` is the parent plugin's PluginContext — same context the plugin itself runs in.
   */
  schema?: (
    this: PluginContext<TOptions>,
    node: SchemaNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
  operation?: (
    this: PluginContext<TOptions>,
    node: OperationNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
  operations?: (
    this: PluginContext<TOptions>,
    nodes: Array<OperationNode>,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
}
```

`options` receives the per-node resolved options produced by `resolver.resolveOptions` — this accounts for per-node `override`, `exclude`, and `include` filters that a plugin author may have configured.

### `defineGenerator` becomes a typed identity

```ts
export function defineGenerator<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
): Generator<TOptions> {
  return generator
}
```

No overloads. No default no-op stubs. No type discrimination.

### Context is passed via `this`, not props

When `runPluginGenerators` dispatches a generator, it calls each method with the plugin's `PluginContext` as the receiver:

```ts
const result = await generator.schema.call(context, node, options)
await renderHookResult(result, fabric)
```

Inside the generator, `this` provides:

| Property | Type | Description |
|---|---|---|
| `this.config` | `Config` | Global Kubb config |
| `this.plugin` | `Plugin<TOptions>` | The parent plugin |
| `this.resolver` | `TOptions['resolver']` | The plugin's resolver |
| `this.adapter` | `Adapter` | The OAS adapter |
| `this.fabric` | `Fabric` | File manager |
| `this.driver` | `PluginDriver` | Plugin driver |
| `this.rootNode` | `RootNode` | AST root |
| `this.options` | `TOptions['resolvedOptions']` | Base plugin options |
| `this.upsertFile` | `(...files) => Promise<void>` | Write files manually |
| `this.warn / .error / .info` | `(msg) => void` | Diagnostics |

### Direct plugin hooks (no generator array needed)

For a plugin with a single output target, `schema`/`operation`/`operations` can be declared directly on the plugin object — same signature, no `defineGenerator`, no `name` required:

```ts
export const myPlugin = createPlugin<MyPlugin>((options) => {
  const { output, format } = options

  return {
    name: 'my-plugin',
    schema(node, options) {
      return <File path={...}><MyType node={node} format={format} /></File>
    },
    operation(node, options) {
      return <File path={...}><MyOperation node={node} /></File>
    },
  }
})
```

### Multi-generator plugin

For plugins that produce multiple distinct output targets (e.g. types + barrel files + legacy compat), use the `generators` array:

```ts
// packages/plugin-ts/src/generators/typeGenerator.ts
export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  schema(node, options) {
    const { enumType, output, group } = options
    const root = path.resolve(this.config.root, this.config.output.path)
    const mode = getMode(path.resolve(root, output.path))
    return (
      <File baseName={...} path={...}>
        <Type name={...} node={node} enumType={enumType} resolver={this.resolver} />
      </File>
    )
  },
  operation(node, options) {
    const root = path.resolve(this.config.root, this.config.output.path)
    return <File ...><OperationType node={node} resolver={this.resolver} /></File>
  },
})

// packages/plugin-ts/src/generators/barrelGenerator.ts
export const barrelGenerator = defineGenerator<PluginTs>({
  name: 'barrel',
  operations(nodes, options) {
    return <BarrelFile nodes={nodes} output={options.output} />
  },
})

// packages/plugin-ts/src/plugin.ts
export const pluginTs = createPlugin<PluginTs>((options) => {
  const preset = getPreset({ ... })
  return {
    name: 'plugin-ts',
    get generators() { return preset.generators },
  }
})
```

### User-extensible generators

Users can replace or extend the generators array:

```ts
pluginTs({
  generators: [
    typeGenerator,       // built-in
    {
      name: 'custom',
      schema(node, options) {
        // this.resolver, this.config etc. available
        return <CustomFile node={node} />
      },
    },
  ],
})
```

## Consequences

### Removed from `core`

| Symbol | File | Replaced by |
|---|---|---|
| `UserReactGeneratorV2` | `defineGenerator.ts` | `Generator<T>` |
| `UserCoreGeneratorV2` | `defineGenerator.ts` | `Generator<T>` |
| `CoreGeneratorV2` | `defineGenerator.ts` | `Generator<T>` |
| `ReactGeneratorV2` | `defineGenerator.ts` | `Generator<T>` |
| `OperationsV2Props` | `defineGenerator.ts` | `this` context |
| `OperationV2Props` | `defineGenerator.ts` | `this` context |
| `SchemaV2Props` | `defineGenerator.ts` | `this` context |
| `Version` | `defineGenerator.ts` | removed |
| `renderSchema` | `renderNode.tsx` | `renderHookResult` |
| `renderOperation` | `renderNode.tsx` | `renderHookResult` |
| `renderOperations` | `renderNode.tsx` | `renderHookResult` |
| `runGeneratorSchema` | `renderNode.tsx` | inline in `runPluginGenerators` |
| `runGeneratorOperation` | `renderNode.tsx` | inline in `runPluginGenerators` |
| `runGeneratorOperations` | `renderNode.tsx` | inline in `runPluginGenerators` |
| `BuildOperationsV2Options` | `renderNode.tsx` | removed |
| `BuildOperationV2Options` | `renderNode.tsx` | removed |
| `BuildSchemaV2Options` | `renderNode.tsx` | removed |
| `RunGeneratorContext` | `renderNode.tsx` | removed |

### Files to update

| File | Change |
|---|---|
| `packages/core/src/defineGenerator.ts` | Full rewrite — new `Generator<T>` type, identity `defineGenerator` |
| `packages/core/src/types.ts` | Update `Generator` import |
| `packages/core/src/runPluginGenerators.ts` | Replace old dispatch helpers with `renderHookResult` |
| `packages/core/src/renderNode.tsx` | Remove helpers listed above |
| `packages/core/src/index.ts` | Update re-exports |
| `packages/plugin-ts/src/generators/typeGenerator.tsx` | Remove `type: 'react'`, rename `Schema→schema`, use `this` |
| `packages/plugin-ts/src/generators/typeGeneratorLegacy.tsx` | Same migration |

### No breaking change for plugin consumers

The `generators` option key on every plugin remains unchanged. Users who pass custom generators will need to update to the new method signatures (`schema` instead of `Schema`, `this` instead of props), but the plugin-level API surface (`pluginTs({ generators: [...] })`) is identical.
