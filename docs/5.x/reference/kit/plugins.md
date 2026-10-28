---
layout: doc
title: Plugins
description: defineExtension with kind plugin defines a Kubb plugin from one
  object with meta, dependencies, and a setup function that returns the resolved
  options, plus the KubbPluginSetupContext that registers generators, resolvers,
  and macros.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Plugins
  icon: i-iconoir-ev-plug
---

# Plugins

Plugins are the main extension point in Kubb. A plugin owns its file naming, its output folder, its lifecycle hooks, and the [generators](./generators) that walk the [AST](/docs/5.x/explanation/architecture#ast) and emit `FileNode` objects.

## `defineExtension`

`defineExtension` with `kind: 'plugin'` takes a definition object and returns a factory. Call it with the user's options to get a `Plugin`. Kubb runs `setup` before the plugin's generators, and the value `setup` returns becomes the plugin's resolved options.

```typescript [plugin-example.ts]
import { defineExtension, type PluginType } from 'kubb/kit'

type PluginExample = PluginType<'plugin-example', { prefix?: string }, { prefix: string }>

export const pluginExample = defineExtension<PluginExample>({
  kind: 'plugin',
  meta: { name: 'plugin-example', version: '1.0.0' },
  dependencies: { 'plugin-ts': {} },
  setup(options, kubb) {
    // Register resolvers, generators, and macros on `kubb`.
    return { prefix: options.prefix ?? '' }
  },
})
```

`PluginType<TName, TOptions, TResolvedOptions, TResolver>` types the plugin. `TOptions` is what users pass, and `TResolvedOptions` is what `setup` returns and generators read. `meta` and `dependencies` are shared with parsers and described in [Extensions](./extensions).

### Definition shape

| Property       | Type                                                          | Required | Description                                                                                                                                                           |
| -------------- | ------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`         | `'plugin'`                                                    | Yes      | Tells `defineExtension` to define a plugin.                                                                                                                           |
| `meta`         | [`ExtensionMeta`](./extensions#meta)                          | Yes      | Name, version, and compatibility. `meta.name` follows `plugin-<feature>`. The plugin's own `name` is deprecated in favor of it, and optional when `meta.name` is set. |
| `setup`        | `(options, kubb: KubbPluginSetupContext) => TResolvedOptions` | No       | Main plugin logic. Receives the user's options and returns the resolved options. Can be `async`.                                                                      |
| `dependencies` | [`ExtensionDependencies`](./extensions#dependencies)          | No       | Plugins this one builds on. They run first, and a missing required one fails the run.                                                                                 |
| `enforce`      | `'pre' \| 'post'`                                             | No       | Run this plugin before (`'pre'`) or after (`'post'`) the normal plugins. Dependency order still wins.                                                                 |
| `hooks`        | `{ 'kubb:plugin:setup'?: ...; ... }`                          | No       | Lifecycle handlers (see [Plugin API](/docs/5.x/explanation/extensions#plugins)). `kubb:plugin:setup` runs after `setup`.                                              |

The `Plugin` the factory returns keeps the user's raw options in `plugin.options`.

### Read `compatibility` from the manifest

A published plugin ships a [`kubb-extension.json`](./manifest) with its `compatibility` ranges. Import only that field into `meta`, so Kubb checks the same ranges at runtime and a bundler leaves the rest of the manifest out of the build:

```typescript [src/plugin.ts]
import { defineExtension } from 'kubb/kit'
import { compatibility } from '../kubb-extension.json'
import { version } from '../package.json'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example', version, compatibility },
})
```

Named imports from JSON need a bundler that inlines them. See [Extension manifest](./manifest#import-compatibility-into-meta).

### `definePlugin` (deprecated)

> [!WARNING]
> `definePlugin` is deprecated. Use `defineExtension` with `kind: 'plugin'` instead.

`definePlugin` takes the same definition object as `defineExtension`, without `kind`. To move over, rename the call and add `kind: 'plugin'`. See [Extensions](./extensions#define-extension).

## Setup context {#setup-context}

`setup` and `kubb:plugin:setup` register generators, the resolver, macros, and options through the setup context. A plugin reaches it in one of two ways:

- **The context argument**: `kubb` in `setup`, and `ctx` in the `kubb:plugin:setup` hook.
- **Composables** from `kubb/kit`, such as `addGenerator()`. They take no context argument, so helper functions that setup calls can use them too.

::::code-group

```typescript [kubb argument]
import { createResolver, defineExtension, defineGenerator } from 'kubb/kit'

const resolver = createResolver({ pluginName: 'plugin-example' })
const generator = defineGenerator({ name: 'example', operation: () => [] })

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  setup(options, kubb) {
    kubb.requirePlugin('plugin-ts')
    kubb.setResolver(resolver)
    kubb.addGenerator(generator)
    return options
  },
})
```

```typescript [Composables]
import { addGenerator, createResolver, defineExtension, defineGenerator, requirePlugin, setResolver } from 'kubb/kit'

const resolver = createResolver({ pluginName: 'plugin-example' })
const generator = defineGenerator({ name: 'example', operation: () => [] })

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  setup(options) {
    requirePlugin('plugin-ts')
    setResolver(resolver)
    addGenerator(generator)
    return options
  },
})
```

::::

| `kubb` member   | Composable        | Signature                                                 | Purpose                                                                       |
| --------------- | ----------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `addGenerator`  | `addGenerator()`  | `(...generators: Array<Generator>) => void`               | Register one or more generators for this plugin                               |
| `setResolver`   | `setResolver()`   | `(resolver: ResolverPatch<Resolver> \| Resolver) => void` | Set or partially override the file naming resolver                            |
| `addMacro`      | `addMacro()`      | `(macro: Macro) => void`                                  | Add a macro that rewrites AST nodes before generators                         |
| `setMacros`     | `setMacros()`     | `(macros: Array<Macro>) => void`                          | Replace this plugin's macros with a new list                                  |
| `setOptions`    | `setOptions()`    | `(options: ResolvedOptions) => void`                      | Set the resolved options used by generators. In `setup`, return them instead. |
| `injectFile`    | `injectFile()`    | `(file: UserFileNode) => void`                            | Inject a raw file into the build output, bypassing generation                 |
| `requirePlugin` | `requirePlugin()` | `(name: string) => Plugin`                                | Return another plugin, or fail the run with `KUBB_PLUGIN_NOT_FOUND`           |
| `memo`          | `memo()`          | `(key: string, compute: () => T) => T`                    | Return a value computed once per build and shared by every plugin             |
| `config`        | `useConfig()`     | `Config`                                                  | The resolved build configuration at setup time                                |
| `options`       | `useOptions()`    | `TOptions`                                                | The plugin's own options as passed by the user                                |

`useKubb()` returns the whole setup context. `tryUseKubb()` does the same, but returns `undefined` outside setup instead of throwing.

Composables read the context of the plugin whose setup is running, also after an `await`. Each plugin gets its own context, so composables in one plugin's setup never reach another plugin. Outside `setup` and `kubb:plugin:setup`, they throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context). That includes generators and later hooks, which run after setup and receive their own `ctx`. Both ways can be used in the same setup.

> [!IMPORTANT]
> Plugin names follow the convention `plugin-<feature>`, such as `plugin-react-query` or `plugin-zod`.
