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

**Unsafe `this` type.** `PluginContext` uses a discriminated union that makes `adapter` and `rootNode` optional (`adapter?: Adapter`). Generator methods always run inside a fully-initialised context where both are present, so every method body required a cast or a null-check.

**Repeated common fields.** Every plugin's `Options` type declared `output?`, `exclude?`, `include?`, and `override?` identically, copy-pasted from plugin to plugin.

## Decision

### `GeneratorContext<TOptions>` — safe `this` type

Generator methods and plugin `schema`/`operation`/`operations` hooks use `GeneratorContext<TOptions>` as their `this` type instead of `PluginContext<TOptions>`. `GeneratorContext` flattens the discriminated union so `adapter` and `rootNode` are always present:

```ts
export type GeneratorContext<TOptions extends PluginFactoryOptions = PluginFactoryOptions> =
  Omit<PluginContext<TOptions>, 'adapter' | 'rootNode'> & {
    adapter: Adapter
    rootNode: RootNode
  }
```

No more `as Required<typeof this>` casts in generator bodies.

### Unified `Generator<TOptions>` type

A generator is a plain object with optional `schema`, `operation`, and `operations` methods. No `type`, no `version`, no capital letters.

```ts
export type Generator<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  name: string
  schema?: (
    this: GeneratorContext<TOptions>,
    node: SchemaNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
  operation?: (
    this: GeneratorContext<TOptions>,
    node: OperationNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
  operations?: (
    this: GeneratorContext<TOptions>,
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

`options` is the per-node resolved options from `resolver.resolveOptions` — already filtered by `exclude`/`include`/`override`. `this` is `GeneratorContext<TOptions>` with `adapter` and `rootNode` guaranteed present.

### `mergeGenerators` — loop-free plugin hooks

`mergeGenerators` takes an array of generators and returns a single merged generator whose methods run each input generator's method in sequence. Plugins call `mergeGenerators` once in their closure, then delegate the three standard hooks to the merged result:

```ts
export const pluginTs = createPlugin<PluginTs>((options) => {
  const preset = getPreset({ ... })
  const mergedGenerator = mergeGenerators(preset.generators)

  return {
    name: 'plugin-ts',
    version,
    async schema(node, opts) {
      return mergedGenerator.schema?.call(this, node, opts)
    },
    async operation(node, opts) {
      return mergedGenerator.operation?.call(this, node, opts)
    },
    async operations(nodes, opts) {
      return mergedGenerator.operations?.call(this, nodes, opts)
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

`this` provides `GeneratorContext<TOptions>`:

| Property | Description |
|---|---|
| `this.config` | Global Kubb config |
| `this.plugin` | The parent plugin |
| `this.resolver` | The plugin's resolver |
| `this.adapter` | The AST adapter (always present) |
| `this.fabric` | File manager |
| `this.rootNode` | AST root (always present) |
| `this.upsertFile` | Write files manually |
| `this.warn / .error / .info` | Diagnostics |

### `PluginBaseOptions<TResolvedOptions>` — shared base for plugin options

Every plugin should support `output`, `exclude`, `include`, and `override`. These four fields are now declared once in `PluginBaseOptions` and each plugin's `Options` type extends it:

```ts
// packages/core/src/types.ts
export type PluginBaseOptions<TResolvedOptions extends object = object> = {
  output?: Output
  exclude?: Array<Exclude>
  include?: Array<Include>
  override?: Array<Override<TResolvedOptions>>
}

// packages/plugin-ts/src/types.ts
export type Options = PluginBaseOptions<ResolvedOptions> & {
  group?: UserGroup
  enumType?: EnumType
  // ... plugin-specific fields only
}
```

`PluginFactoryOptions` constrains `TOptions extends PluginBaseOptions<TResolvedOptions>` so this is enforced at the type level. All fields are optional, so existing code passes unchanged.

### `PluginRegistry` — typed plugin lookup

Each plugin augments `Kubb.PluginRegistry` in its `types.ts` so that `getPlugin`/`requirePlugin` return fully typed results without casts:

```ts
// packages/plugin-ts/src/types.ts
declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-ts': PluginTs
    }
  }
}
```

### `version` field — per-plugin semver

Every plugin now exposes its semver string from `package.json` via the `version` field on the returned plugin object. The field is already declared as `version?: string` on the `Plugin` type:

```ts
import { version } from '../package.json'

return {
  name: pluginTsName,
  version,
  // ...
}
```

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

`getPreset` merges user generators into `preset.generators`, which is then consumed by `mergeGenerators` in the plugin closure.

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
| `version: '2'` discriminant | `defineGenerator.ts` |
| `Schema / Operation / Operations` (capital) | all generators |
| `renderSchema / renderOperation` etc. | `renderNode.tsx` |
| `renderHookResult` (renamed) | `renderNode.tsx` → `applyHookResult` |
| `UserReactGeneratorV2 / UserCoreGeneratorV2` | `defineGenerator.ts` |
| Repeated `output? / exclude? / include? / override?` | each plugin's `Options` type |

### Added / changed

| Symbol | Location |
|---|---|
| `Generator<TOptions>` (unified) | `packages/core/src/defineGenerator.ts` |
| `defineGenerator` (identity) | `packages/core/src/defineGenerator.ts` |
| `mergeGenerators` | `packages/core/src/defineGenerator.ts` |
| `applyHookResult` | `packages/core/src/renderNode.tsx` |
| `GeneratorContext<TOptions>` | `packages/core/src/types.ts` |
| `PluginBaseOptions<TResolvedOptions>` | `packages/core/src/types.ts` |
| `Kubb.PluginRegistry` augmentations | every plugin's `types.ts` |
| `version` field | every plugin's `plugin.ts` |

### Unchanged

- `Preset.generators?: Array<Generator<any>>` — presets still carry generators
- User-facing `generators` option on plugin option types
- `runPluginAstHooks` — unchanged; already handles barrel files
- Direct plugin hooks `schema`/`operation`/`operations` on `Plugin`/`PluginLifecycle`
- The `pluginTs({ generators: [...] })` call API


