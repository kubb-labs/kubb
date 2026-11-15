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

A plugin generates code from the AST. Define one with [`defineExtension`](/docs/5.x/reference/kit/extensions#define-extension) and `kind: 'plugin'`. Its `setup` registers [generators](/docs/5.x/reference/kit/generators), a [resolver](/docs/5.x/reference/kit/resolvers), and macros, then returns the options generators read as `ctx.options`. [`meta`](/docs/5.x/reference/kit/extensions#meta) and the [factory statics](/docs/5.x/reference/kit/extensions#factory-statics) work as for every extension.

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

`PluginType<TName, TOptions, TResolvedOptions, TResolver>` types the plugin. `TOptions` is what users pass, and `TResolvedOptions` is what `setup` returns.

| Field          | Type                                                          | Description                                                                                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `setup`        | `(options, kubb: KubbPluginSetupContext) => TResolvedOptions` | Runs once per build, before `kubb:plugin:setup`. Can be `async`.                                                   |
| `dependencies` | [`ExtensionDependencies`](/docs/5.x/reference/kit/extensions#dependencies)                      | Plugins this one builds on.                                                                                        |
| `enforce`      | `'pre' \| 'post'`                                             | Runs the plugin before or after the others. Dependencies still run first.                                         |
| `hooks`        | `{ [hook]: handler }`                                         | Handlers for any [lifecycle hook](/docs/5.x/reference/kit/hooks).                                                  |

## Setup context {#setup-context}

`setup` and the `kubb:plugin:setup` hook register everything through the setup context: the `kubb` argument (`ctx` in the hook) or a composable from `kubb/kit`. Composables take no argument, so helpers that `setup` calls can use them too.

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

| Member          | Signature                                                 | Purpose                                                                         |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `addGenerator`  | `(...generators: Array<Generator>) => void`               | Registers generators.                                                           |
| `setResolver`   | `(resolver: ResolverPatch<Resolver> \| Resolver) => void` | Sets the resolver. A patch merges over the defaults.                            |
| `addMacro`      | `(macro: Macro) => void`                                  | Adds a macro that rewrites nodes before generators run.                         |
| `setMacros`     | `(macros: ReadonlyArray<Macro>) => void`                  | Replaces this plugin's macros.                                                  |
| `setOptions`    | `(options: ResolvedOptions) => void`                      | Sets the resolved options. In `setup`, return them instead.                     |
| `injectFile`    | `(file: UserFileNode) => void`                            | Adds a file outside generation. Set `copy` to an absolute path to copy a template. |
| `requirePlugin` | `(name: string) => Plugin`                                | Returns another plugin, or fails with `KUBB_PLUGIN_NOT_FOUND`.                  |
| `memo`          | `(key: string, compute: () => T) => T`                    | Computes a value once per build, shared by every plugin.                        |
| `config`        | `Config`                                                  | The resolved build configuration. Composable: `useConfig()`.                    |
| `options`       | `TOptions`                                                | The options the user passed. Composable: `useOptions()`.                        |

Methods have a composable of the same name, such as `addGenerator()`. `useKubb()` returns the whole context, and `tryUseKubb()` returns `undefined` outside setup instead of throwing.

> [!WARNING]
> Composables work only in `setup` and `kubb:plugin:setup`. In generators and anywhere else, they throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).

See [Memo caches](EDGE:memo-cache) to cache outside a build.

## Plugin naming {#plugin-naming}

| Surface            | Pattern                                            | Example            |
| ------------------ | -------------------------------------------------- | ------------------ |
| npm package        | `@<scope>/plugin-<name>` or `kubb-plugin-<name>`   | `@kubb/plugin-zod` |
| `meta.name`        | `plugin-<name>`                                    | `'plugin-zod'`     |
| Factory export     | `plugin<Name>`                                     | `pluginZod`        |
| Name constant      | `plugin<Name>Name`                                 | `pluginZodName`    |
| `PluginType` alias | `Plugin<Name>`                                     | `PluginZod`        |

Type the name constant with `satisfies`: `export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']`.
