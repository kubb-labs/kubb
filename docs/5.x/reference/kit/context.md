---
layout: doc
title: Context - this, ctx and useKubb() in every hook
description: "Reference for the context Kubb passes to plugin code: what this, the ctx argument and useKubb() are in each hook, which composables work where, and withContext."
outline:
  - 2
  - 3
order: 12
navigation:
  title: Context
  icon: i-iconoir-mirror
---

# Context

Kubb runs every plugin hook with one context object. In each hook, `this`, the `ctx` argument and `useKubb()` are that same object, also after an `await`. Composables read it, so they work in every hook, not only in `setup`.

## Where code runs {#where-code-runs}

The context depends on where your code runs. Printer handlers and macro callbacks are the exceptions: they get their own small context as `this` and as their second argument, while `useKubb()` keeps returning the context of the hook that runs them.

| Code                                                                                                        | `this` and `ctx`                                    | `useKubb()` returns                    |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| `setup` and `kubb:plugin:setup`                                                                             | The setup context                                   | The setup context                      |
| Events Kubb fires: `kubb:build:start`, `kubb:plugin:start`, `kubb:plugin:end`, `kubb:plugins:end`, `kubb:build:end` | The plugin's own visit context                      | The plugin's own visit context         |
| Events fired inside a hook, with `ctx.hooks.callHook(...)`                                                  | The context of the hook that fired the event        | The context of the hook that fired it  |
| Visit hooks: `kubb:plugin:visit:start`, `:schema`, `:operation`, `:end`                                     | The plugin's visit context                          | The plugin's visit context             |
| Template `render`, the printer factory and the `kubb:generate:*` events                                     | The template context                                | The template context                   |
| [Printer handlers](/docs/5.x/reference/kit/ast#printer-handlers-and-context)                                | The printer context, with `transform` and `base`    | The template context                   |
| [Macro callbacks](/docs/5.x/reference/kit/ast#macro-options-and-callbacks)                                  | The walk context, with the node's `parent`          | The visit context of the running hook  |

A plugin has one visit context per build. Its bus hooks and its visit hooks get the same object, so a value you set on it in `kubb:build:start` is there in `kubb:plugin:visit:schema`.

- The [setup context](/docs/5.x/reference/kit/plugins#setup-context) holds `options`, `setOptions`, `injectFile` and the members every context has.
- The visit context holds `config`, `plugin`, `memo`, `hooks`, `requirePlugin`, `upsertFile` and the other [visit hook](/docs/5.x/reference/kit/hooks#visit-hooks) members.
- The [template context](/docs/5.x/reference/kit/templates#templatecontext) is the visit context plus `resolver`, `getResolver(name)`, per-node `options` and `printer`.

## Composables {#composables}

Use composables for plugin-level concepts in `setup`, and read `ctx` for the rest.

| Composable                                                                  | Works in                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `useKubb()`, `tryUseKubb()`                                                 | Any hook. `tryUseKubb()` returns `undefined` outside one instead of throwing.            |
| `useConfig()`, `requirePlugin(name)`                                        | Any hook.                                                                                |
| `memo(key, fn)`, `memo.get`, `memo.set`, `memo.has`                         | Any hook. They read the build memo of the running hook.                                  |
| `memo(store, key, fn)`                                                      | Anywhere. It caches in the store you pass and needs no hook.                             |
| `getResolver(name)`                                                         | Any hook. Pass a memo as the second argument, `getResolver(name, memo)`, outside a hook. |
| `setOptions()`, `useOptions()`, `injectFile()`                              | `setup` and `kubb:plugin:setup`. Elsewhere they throw `KUBB_NO_CONTEXT`.                 |
| `addTemplate()`, `setResolver()`, `addMacro()`, `setMacros()`, `setPrinter()`, `provide()`  | `setup` and `kubb:plugin:setup` of a plugin defined with `defineExtension` from `kubb/kit`. |

Outside every hook, a composable that needs a context throws [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).

```typescript [plugin.ts]
import { defineExtension, getResolver, memo, useConfig } from 'kubb/kit'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  hooks: {
    'kubb:plugin:visit:schema'(node) {
      const names = memo('plugin-example:names', () => new Set<string>())
      if (node.name) names.add(getResolver('plugin-ts').name(node.name))
      console.log(useConfig().root, this.plugin.name)
    },
  },
})
```

### Setup methods {#setup-methods}

In a plugin defined with `defineExtension` from `kubb/kit`, the setup context also has the setup composables as methods. See [Setup context](/docs/5.x/reference/kit/plugins#setup-context).

## `withContext` {#withcontext}

`withContext(ctx, fn)` runs `fn` with `ctx` as its `this`, its argument and the value `useKubb()` returns, also after an `await` in `fn`. It returns what `fn` returns. Kubb runs every hook through it.

```typescript [Type definition]
function withContext<TContext extends object, TResult>(ctx: TContext, fn: (this: TContext, ctx: TContext) => TResult): TResult
```

Extension authors use it to run their own callbacks with a context, so composables work there too:

```typescript
import { useKubb, withContext } from 'kubb/kit'

await withContext(ctx, async function () {
  console.log(this === useKubb()) // true
})
```

### In tests {#in-tests}

A plugin test can call a template or hook through `withContext` instead of `kubbContext.run`. It also sets `this`, so code that reads `this` or `useKubb()` sees your test context:

```typescript [template.test.ts]
import { withContext } from 'kubb/kit'

const files = await withContext(ctx, (ctx) => typeSchema.render.call(ctx, node, ctx))
```
