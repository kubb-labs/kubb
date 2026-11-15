---
layout: doc
title: Plugins - Define a Kubb plugin with defineExtension
description: "Define a Kubb plugin with defineExtension and kind plugin: meta, dependencies, setup, and the setup context that registers generators."
outline:
  - 2
  - 3
order: 1
navigation:
  title: Plugins
  icon: i-iconoir-ev-plug
---

# Plugins

A plugin generates code from the AST. Its `setup` registers [generators](/docs/5.x/reference/kit/generators), a [resolver](/docs/5.x/reference/kit/resolvers), and macros. It returns the resolved options, which generators read as `ctx.options`. Define one with [`defineExtension`](/docs/5.x/reference/kit/extensions#define-extension) and `kind: 'plugin'`. [`meta`](/docs/5.x/reference/kit/extensions#meta), [`dependencies`](/docs/5.x/reference/kit/extensions#dependencies), and the [factory statics](/docs/5.x/reference/kit/extensions#factory-statics) work the same for every extension.

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

`PluginType<TName, TOptions, TResolvedOptions, TResolver>` types the plugin: `TOptions` is what users pass, `TResolvedOptions` what `setup` returns.

| Field          | Type                                                          | Description                                                                                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `setup`        | `(options, kubb: KubbPluginSetupContext) => TResolvedOptions` | Runs once per build, before `kubb:plugin:setup`. Can be `async`.                                                   |
| `dependencies` | [`ExtensionDependencies`](/docs/5.x/reference/kit/extensions#dependencies)                      | Plugins this one builds on.                                                                                        |
| `enforce`      | `'pre' \| 'post'`                                             | Runs the plugin before (`'pre'`) or after (`'post'`) the others. Dependencies still run first.                     |
| `hooks`        | `{ [hook]: handler }`                                         | Handlers for any [lifecycle hook](/docs/5.x/reference/kit/hooks). The `kubb:plugin:setup` handler runs after `setup`. |

## Setup context {#setup-context}

`setup` and the `kubb:plugin:setup` hook register everything through the setup context. Reach it as the context argument (`kubb` in `setup`, `ctx` in the hook), or through composables from `kubb/kit`, such as `addGenerator()`. Composables take no context argument, so helpers that `setup` calls can use them too.

::code-group

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

::

| `kubb` member   | Composable        | Signature                                                 | Purpose                                                                         |
| --------------- | ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `addGenerator`  | `addGenerator()`  | `(...generators: Array<Generator>) => void`               | Registers generators for this plugin.                                           |
| `setResolver`   | `setResolver()`   | `(resolver: ResolverPatch<Resolver> \| Resolver) => void` | Sets the resolver. A patch merges over the built-in defaults.                   |
| `addMacro`      | `addMacro()`      | `(macro: Macro) => void`                                  | Adds a macro that rewrites AST nodes before generators run.                     |
| `setMacros`     | `setMacros()`     | `(macros: ReadonlyArray<Macro>) => void`                  | Replaces this plugin's macros.                                                  |
| `setOptions`    | `setOptions()`    | `(options: ResolvedOptions) => void`                      | Sets the resolved options. In `setup`, return them instead.                     |
| `injectFile`    | `injectFile()`    | `(file: UserFileNode) => void`                            | Adds a file to the output, outside generation. Set `copy` to an absolute path to copy a shipped template. |
| `requirePlugin` | `requirePlugin()` | `(name: string) => Plugin`                                | Returns another plugin, or fails with `KUBB_PLUGIN_NOT_FOUND`.                  |
| `memo`          | `memo()`          | `(key: string, compute: () => T) => T`                    | Returns a value computed once per build and shared by every plugin.             |
| `config`        | `useConfig()`     | `Config`                                                  | The resolved build configuration.                                               |
| `options`       | `useOptions()`    | `TOptions`                                                | The plugin's options as the user passed them.                                   |

`useKubb()` returns the whole context, and `tryUseKubb()` returns `undefined` outside setup instead of throwing. Composables read the context of the plugin whose setup is running, also after an `await`. Outside `setup` and `kubb:plugin:setup`, including in generators, they throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).

`memo(store, key, compute)` caches in a store you own, outside a build: a `Map`, a `WeakMap`, or `memo.create()`. `memo.create({ weak: true })` frees an entry with its key, and `memo.create({ max })` empties the store when it is full.

## Plugin naming {#plugin-naming}

| Surface            | Pattern                                            | Example            |
| ------------------ | -------------------------------------------------- | ------------------ |
| npm package        | `@<scope>/plugin-<name>` or `kubb-plugin-<name>`   | `@kubb/plugin-zod` |
| `meta.name`        | `plugin-<name>`                                    | `'plugin-zod'`     |
| Factory export     | `plugin<Name>`                                     | `pluginZod`        |
| Name constant      | `plugin<Name>Name`                                 | `pluginZodName`    |
| `PluginType` alias | `Plugin<Name>`                                     | `PluginZod`        |

Type the name constant with `satisfies`: `export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']`.
