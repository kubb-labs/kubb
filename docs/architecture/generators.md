# Simplified Generators — Architecture Decision Record

## Status

Accepted

## Context

Kubb plugins generate files by walking a `RootNode` AST and mapping each `SchemaNode` or `OperationNode` to one or more output files. The code that performs this mapping lives in **generators** — objects that implement `schema`, `operation`, and `operations` methods.

The generator API accumulated friction over time:

**`type: 'react' | 'core'` split.** Every generator had to declare whether it produces React elements or raw file arrays, forcing authors to think about the output mechanism instead of the output content.

**Prop drilling.** Each method received a large props object (`{ node, adapter, options, config, resolver, plugin, driver }`) even though all of those values are already present on the `PluginContext` that owns the generator.

**`version: '2'` noise.** Generators carried a discriminant that no consumer checked at runtime.

**`generators` on the `Plugin` type.** Plugins exposed `generators?: Array<Generator>` as a framework-level property, which created two separate dispatch paths in `build.ts` — one for `plugin.generators` and one for direct `plugin.schema`/`operation`/`operations` hooks. The generators array is an implementation detail of the plugin and does not need to be visible to the framework.

**`runPluginGenerators.ts` duplicated `runPluginAstHooks`.** Both walked the AST, collected operations, and called `renderHookResult`. Two maintenance surfaces for the same logic.

## Decision

### Unified `Generator<TOptions>` type

A generator is a plain object with optional `schema`, `operation`, and `operations` methods. No `type`, no `version`, no capital letters.

```ts
export type Generator<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  name: string
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

export function defineGenerator<TOptions extends PluginFactoryOptions>(
  generator: Generator<TOptions>,
): Generator<TOptions> {
  return generator
}
```

`options` is the per-node resolved options from `resolver.resolveOptions` — already filtered by `exclude`/`include`/`override`. `this` is the parent plugin's `PluginContext`.

### `generators` moves from the Plugin type into the plugin closure

`generators` is removed from `Plugin` and `PluginLifecycle`. The generators array becomes a closure variable inside `createPlugin`. The plugin's own `schema`/`operation`/`operations` hooks loop over it directly:

```ts
export const pluginTs = createPlugin<PluginTs>((options) => {
  const preset = getPreset({ ... })
  const generators = preset.generators

  return {
    name: 'plugin-ts',
    schema(node, opts) {
      return Promise.all(generators.map((gen) => gen.schema?.call(this, node, opts)))
    },
    operation(node, opts) {
      return Promise.all(generators.map((gen) => gen.operation?.call(this, node, opts)))
    },
    operations(nodes, opts) {
      return Promise.all(generators.map((gen) => gen.operations?.call(this, nodes, opts)))
    },
    async install() {
      await this.openInStudio({ ast: true })
    },
  }
})
```

The framework only sees three standard hooks. `build.ts` dispatches everything through the single `runPluginAstHooks` path.

### Single output plugin (no generators needed)

```ts
export const myPlugin = createPlugin<MyPlugin>((options) => ({
  name: 'my-plugin',
  schema(node, opts) {
    return <File path={...}><MyType node={node} /></File>
  },
  operation(node, opts) {
    return <File path={...}><MyOperation node={node} /></File>
  },
}))
```

### Generator with `this` context

```ts
export const typeGenerator = defineGenerator<PluginTs>({
  name: 'typescript',
  schema(node, options) {
    const { enumType, output, group } = options
    const root = path.resolve(this.config.root, this.config.output.path)
    return (
      <File baseName={...} path={...}>
        <Type name={...} node={node} enumType={enumType} resolver={this.resolver} />
      </File>
    )
  },
  operation(node, options) {
    return <File ...><OperationType node={node} resolver={this.resolver} /></File>
  },
})
```

`this` provides the full `PluginContext`:

| Property | Description |
|---|---|
| `this.config` | Global Kubb config |
| `this.plugin` | The parent plugin |
| `this.resolver` | The plugin's resolver |
| `this.adapter` | The AST adapter |
| `this.fabric` | File manager |
| `this.rootNode` | AST root |
| `this.upsertFile` | Write files manually |
| `this.warn / .error / .info` | Diagnostics |

### User-extensible generators

The `generators` option on plugin option types (e.g. `PluginTs['options'].generators`) stays unchanged. Users can still pass custom generators:

```ts
pluginTs({
  generators: [
    typeGenerator,
    {
      name: 'custom',
      schema(node, options) {
        return <CustomFile node={node} />
      },
    },
  ],
})
```

`getPreset` merges user generators into `preset.generators`, which is then used by the plugin closure.

### `build.ts` dispatch — single path

```ts
// Before — two paths
if (plugin.generators?.length) await runPluginGenerators(plugin, context, driver)
if (plugin.schema || ...)      await runPluginAstHooks(plugin, context)

// After — single path
if (plugin.schema || plugin.operation || plugin.operations) {
  await runPluginAstHooks(plugin, context)
}
```

`runPluginAstHooks` handles the AST walk, exclude/include filtering, operations collection, and barrel file generation.

## Consequences

### Removed

| Symbol | Location |
|---|---|
| `generators?` property | `Plugin` + `PluginLifecycle` in `types.ts` |
| `runPluginGenerators` | `packages/core/src/runPluginGenerators.ts` (deleted) |
| `type: 'react' \| 'core'` | `defineGenerator.ts` |
| `version: '2'` | `defineGenerator.ts` |
| `Schema / Operation / Operations` (capital) | all generators |
| `renderSchema / renderOperation` etc. | `renderNode.tsx` |
| `UserReactGeneratorV2 / UserCoreGeneratorV2` etc. | `defineGenerator.ts` |

### Added / changed

| Symbol | Location |
|---|---|
| `Generator<TOptions>` (unified) | `packages/core/src/defineGenerator.ts` |
| `defineGenerator` (identity) | `packages/core/src/defineGenerator.ts` |
| `renderHookResult` | `packages/core/src/renderNode.tsx` |

### Unchanged

- `Preset.generators?: Array<Generator<any>>` — presets still carry generators
- User-facing `generators` option on plugin option types
- `runPluginAstHooks` — unchanged; already handles barrel files
- Direct plugin hooks `schema`/`operation`/`operations` on `Plugin`/`PluginLifecycle`
- The `pluginTs({ generators: [...] })` call API

