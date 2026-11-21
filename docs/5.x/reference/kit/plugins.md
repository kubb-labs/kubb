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

`PluginType<TName, TOptions, TResolvedOptions, TResolver, TPrinter>` types the plugin. `TOptions` is what users pass, and `TResolvedOptions` is what `setup` returns. `TPrinter` types `ctx.printer`.

| Field          | Type                                                          | Description                                                                                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `setup`        | `(options, kubb: KubbPluginSetupContext) => TResolvedOptions` | Runs once per build, before `kubb:plugin:setup`. Can be `async`.                                                   |
| `dependencies` | [`ExtensionDependencies`](/docs/5.x/reference/kit/extensions#dependencies)                      | Plugins this one builds on.                                                                                        |
| `enforce`      | `'pre' \| 'post'`                                             | Runs the plugin before or after the others. Dependencies still run first.                                         |
| `hooks`        | `{ [hook]: handler }`                                         | Handlers for any [lifecycle hook](/docs/5.x/reference/kit/hooks).                                                  |

## Setup context {#setup-context}

`setup` and the `kubb:plugin:setup` hook register resolvers, generators, macros and printers with the composables from `kubb/kit`: `setResolver`, `addGenerator`, `addMacro`, `setMacros` and `setPrinter`. Composables take no context argument, so helpers that `setup` calls can use them too.

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
> The composables work only in a plugin defined with `defineExtension` from `kubb/kit`. The setup context no longer has `addGenerator`, `setResolver`, `addMacro` or `setMacros`.

The setup context, the `kubb` argument of `setup` (`ctx` in the hook), holds these members:

| Member          | Signature                                                 | Purpose                                                                         |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `setOptions`    | `(options: ResolvedOptions) => void`                      | Sets the resolved options. In `setup`, return them instead.                     |
| `injectFile`    | `(file: UserFileNode) => void`                            | Adds a file outside generation. Set `copy` to an absolute path to copy a template. |
| `requirePlugin` | `(name: string) => Plugin`                                | Returns another plugin, or fails with `KUBB_PLUGIN_NOT_FOUND`.                  |
| `memo`          | `(key: string, compute: () => T) => T`                    | Computes a value once per build, shared by every plugin. `memo.get(key)`, `memo.set(key, value)` and `memo.has(key)` read and replace a value directly. |
| `plugin`        | `{ name: string, meta: ExtensionMeta }`                   | The name and meta of the plugin being set up. |
| `config`        | `Config`                                                  | The resolved build configuration. Composable: `useConfig()`.                    |
| `options`       | `TOptions`                                                | The options the user passed. Composable: `useOptions()`.                        |

Methods have a composable of the same name, such as `requirePlugin()`. `useKubb()` returns the whole context, and `tryUseKubb()` returns `undefined` outside setup instead of throwing.

The setup context is also `this` in `setup` and `kubb:plugin:setup`, so `this`, `ctx` and `useKubb()` are the same object. `setOptions()`, `useOptions()` and `injectFile()` run only in setup, and throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context) anywhere else.

To run your own code with a context, call `withContext(ctx, fn)`. It runs `fn` with `ctx` as its `this`, its argument and the value `useKubb()` returns, also after an `await` in `fn`:

```typescript
import { useKubb, withContext } from 'kubb/kit'

await withContext(ctx, async function () {
  console.log(this === useKubb()) // true
})
```

> [!WARNING]
> `useKubb()`, `useConfig()` and `memo()` work in `setup`, `kubb:plugin:setup` and the [hooks in your `hooks` map](/docs/5.x/reference/kit/hooks#hook-listener-scope), [visit hooks](/docs/5.x/reference/kit/hooks#visit-hooks) included, where `useKubb()` returns your plugin's visit context. `setOptions()`, `useOptions()` and `injectFile()` work only in `setup` and `kubb:plugin:setup`. Anywhere else, composables throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).

To cache outside a build, see [Memo caches](#memo-cache).

### Printer {#printer}

`setPrinter(factory)` registers the printer your generators use. Kit calls the factory with the printer context, as its argument, `this` and `useKubb()`, once per build, and once more for each `override` that matches a node. Generators get the result as `ctx.printer`, and pass per-node options with `printer.with(...)`. Type a factory you export with `PrinterFactory<PluginType>`, so its `ctx` (a `PrinterContext`) is inferred.

```typescript
import { addGenerator, createPrinter, defineExtension, defineGenerator, type PluginType, setPrinter } from 'kubb/kit'

const printerExample = createPrinter((options: { name?: string }) => ({ name: 'example', options, nodes: { string: () => 'string' } }))

type PluginExample = PluginType<'plugin-example', object, object, unknown, ReturnType<typeof printerExample>>

const generator = defineGenerator<PluginExample>({
  name: 'example',
  schema(node, ctx) {
    ctx.info(`${node.name}: ${ctx.printer.with({ name: node.name }).print(node)}`)
    return null
  },
})

export const pluginExample = defineExtension<PluginExample>({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  setup(options) {
    setPrinter<PluginExample>(() => printerExample())
    addGenerator(generator)
    return options
  },
})
```

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

```typescript [patterns.ts]
import { memo } from 'kubb/kit'

const patterns = memo.create<string, RegExp>({ max: 1000 })

export const toRegExp = (pattern: string) => memo(patterns, pattern, () => new RegExp(pattern))
```

### Setup composables {#setup-composables}

When your plugin's `setup` awaits something before it calls a composable, the composable still reads the context of the plugin whose setup is running.

Outside `setup` and `kubb:plugin:setup`, including in generators, composables throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).
