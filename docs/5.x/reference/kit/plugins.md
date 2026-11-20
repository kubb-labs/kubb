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

`setup` and the `kubb:plugin:setup` hook register resolvers, generators and macros with the composables from `kubb/kit`: `setResolver`, `addGenerator`, `addMacro` and `setMacros`. Composables take no context argument, so helpers that `setup` calls can use them too.

```typescript
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

> [!WARNING]
> `kubb.addGenerator`, `kubb.setResolver`, `kubb.addMacro` and `kubb.setMacros` on the setup context are deprecated. Call the composable of the same name instead.

The setup context, the `kubb` argument of `setup` (`ctx` in the hook), holds these members:

| Member          | Signature                                                 | Purpose                                                                         |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `setOptions`    | `(options: ResolvedOptions) => void`                      | Sets the resolved options. In `setup`, return them instead.                     |
| `injectFile`    | `(file: UserFileNode) => void`                            | Adds a file outside generation. Set `copy` to an absolute path to copy a template. |
| `requirePlugin` | `(name: string) => Plugin`                                | Returns another plugin, or fails with `KUBB_PLUGIN_NOT_FOUND`.                  |
| `memo`          | `(key: string, compute: () => T) => T`                    | Computes a value once per build, shared by every plugin.                        |
| `config`        | `Config`                                                  | The resolved build configuration. Composable: `useConfig()`.                    |
| `options`       | `TOptions`                                                | The options the user passed. Composable: `useOptions()`.                        |

Methods have a composable of the same name, such as `requirePlugin()`. `useKubb()` returns the whole context, and `tryUseKubb()` returns `undefined` outside setup instead of throwing.

> [!WARNING]
> Composables work only in `setup` and `kubb:plugin:setup`. In generators and anywhere else, they throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).

To cache outside a build, see [Memo caches](#memo-cache).

## Shared option types {#shared-option-types}

`PluginOptions` and `ResolvedPluginOptions` type the [options every generator plugin shares](/docs/5.x/reference/plugin-options): `output`, `group`, `include`, `exclude`, and `override`. Intersect them into your own types and add the plugin's keys. The type argument is the options object an `override` entry can set.

```typescript [types.ts]
import type { PluginOptions, PluginType, ResolvedPluginOptions } from 'kubb/kit'

export type Options = PluginOptions<ResolvedOptions> & {
  prefix?: string
}

export type ResolvedOptions = ResolvedPluginOptions<ResolvedOptions> & {
  prefix: string
}

export type PluginExample = PluginType<'plugin-example', Options, ResolvedOptions>
```

| Type                    | Keys                                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `PluginOptions`         | What users pass: optional `output`, `group`, `exclude`, `include`, and `override`.                  |
| `ResolvedPluginOptions` | What `setup` returns: `output`, `exclude`, `include` or `undefined`, `override`, `group` or `null`. |

## Plugin naming {#plugin-naming}

| Surface            | Pattern                                            | Example            |
| ------------------ | -------------------------------------------------- | ------------------ |
| npm package        | `@<scope>/plugin-<name>` or `kubb-plugin-<name>`   | `@kubb/plugin-zod` |
| `meta.name`        | `plugin-<name>`                                    | `'plugin-zod'`     |
| Factory export     | `plugin<Name>`                                     | `pluginZod`        |
| Name constant      | `plugin<Name>Name`                                 | `pluginZodName`    |
| `PluginType` alias | `Plugin<Name>`                                     | `PluginZod`        |

Type the name constant with `satisfies`: `export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']`.

## Less common cases {#less-common-cases}

### Memo caches {#memo-cache}

When your plugin computes the same value many times, cache it with `memo`.

| Call | Cache |
| --- | --- |
| `this.memo(key, compute)` in a resolver | Computes each value once per build. |
| `memo(store, key, compute)` | Caches in a store you own, outside a build: a `Map`, a `WeakMap`, or `memo.create()`. |

- `memo.create({ weak: true })` frees an entry with its key.
- `memo.create({ max })` empties the store when it is full.
- To type a `this.memo` value, register the key's `prefix:` and its value type in `Kubb.MemoRegistry`.

To keep a plugin's keys apart from other plugins' keys, call `memo.scope(ctx, name)` with the plugin's name constant. It returns a memo that puts `name:` in front of every key. Register each slot with its full key in `Kubb.MemoRegistry`. The scoped memo offers only the slots that start with `name:`, and a slot can carry a `:rest` such as `printer:mini`.

```typescript [generator.ts]
import { memo } from 'kubb/kit'

declare global {
  namespace Kubb {
    interface MemoRegistry {
      'plugin-example:cyclic': Set<string>
    }
  }
}

const exampleMemo = memo.scope(ctx, pluginExampleName)
const cyclic = exampleMemo('cyclic', () => new Set()) // key plugin-example:cyclic, typed Set<string>
```

```typescript [patterns.ts]
import { memo } from 'kubb/kit'

const patterns = memo.create<string, RegExp>({ max: 1000 })

export const toRegExp = (pattern: string) => memo(patterns, pattern, () => new RegExp(pattern))
```

### Setup composables {#setup-composables}

When your plugin's `setup` awaits something before it calls a composable, the composable still reads the context of the plugin whose setup is running.

Outside `setup` and `kubb:plugin:setup`, including in generators, composables throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).
