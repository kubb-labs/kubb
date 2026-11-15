---
layout: doc
title: Plugin internals - Caches, hooks, storage, and AST
description: Plugin author details on memo caches, composables, hook scope, file hook payloads, storage keys, AST helpers, printers, and programmatic builds.
outline:
  - 2
  - 3
order: 11
navigation:
  title: Plugin internals
  icon: i-iconoir-cpu
---

# Plugin internals

Plugin, adapter, and storage authors need these details on caching, hook scope, storage keys, AST helpers, printers, and builds from code, which the [kit reference](/docs/5.x/reference/kit) leaves out.

## Memo caches {#memo-cache}

When your plugin computes the same value many times, cache it with `memo`. Sources: [Setup context](/docs/5.x/reference/kit/plugins#setup-context) and [Resolver overrides](/docs/5.x/reference/kit/resolvers#resolver-overrides).

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

## Setup composables {#setup-composables}

When your plugin's `setup` awaits something before it calls a composable, the composable still reads the context of the plugin whose setup is running. Source: [Setup context](/docs/5.x/reference/kit/plugins#setup-context).

Outside `setup` and `kubb:plugin:setup`, including in generators, composables throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).

## Hook listener scope {#hook-listener-scope}

When your plugin listens through its `hooks` map, it receives the hooks from `kubb:setup:end` to `kubb:build:end`, including `kubb:plugin:setup` for that plugin. Source: [Lifecycle hooks](/docs/5.x/reference/kit/hooks).

- Kubb adds these listeners during setup and removes them when the build ends.
- They miss the `lifecycle` and `generation` hooks, `kubb:setup:start`, and the output passes.
- `kubb:plugin:setup` fires once per plugin, after its `setup` and before `kubb:build:start`. Kubb calls the plugin's own handler directly.
- `kubb:lifecycle:start` fires when `kubb generate` starts, before the first config. `.generate()` and the bundler plugins skip it.

## File hook payloads {#file-hook-payloads}

When you listen to `kubb:file:processed`, you get `{ file, source, stored }` after each file is printed and handed to the storage. Source: [Build pipeline](/docs/5.x/reference/kit/hooks#build-pipeline).

| Field | Holds |
| --- | --- |
| `source` | The text before any output pass. |
| `stored` | What the storage held at that path, or `null` when the path was empty or `output.clean` emptied its folder. |

## Storage keys {#storage-keys}

When you call `readKeys()` or `empty()` on a built-in backend, the result depends on the backend. Source: [Built-in backends](/docs/5.x/reference/kit/storage#built-in-backends).

| Backend | `readKeys(base?)` returns | `empty()` without `base` |
| --- | --- | --- |
| `fsStorage()` | Paths relative to `base`, or to the working directory | Does nothing |
| `memoryStorage()` | The stored keys (absolute paths) that start with `base` | Deletes every entry |

In `writeItem()`, `stored` is the previous content when Kubb already read it, so the backend can skip a second read.

## Schema search cache {#schema-search-cache}

When you call `ast.schema.find` across many schemas, reuse its answers with a `cache`. Source: [`ast.schema`](/docs/5.x/reference/kit/ast#ast-schema).

- `ast.schema.find` returns the first schema in a tree that matches.
- Set `followRefs: true` to look through resolved refs.
- Keep one `cache` per predicate and `followRefs` value, so later calls skip what earlier ones searched.

```typescript [find-cache.ts]
import { ast } from 'kubb/kit'

const dateCache = new WeakMap<ast.SchemaNode, ast.SchemaNode | null>()
const hasDate = (schema: ast.SchemaNode) =>
  ast.schema.find(schema, { followRefs: true, cache: dateCache, predicate: (node) => node.type === 'date' }) !== undefined
```

## AST helper details {#ast-helper-details}

When an AST helper's result surprises you, check these details. Source: [AST and node builders](/docs/5.x/reference/kit/ast).

Helper names are a verb plus what they return (`getName`) or a question (`isJson`).

| Helper | Detail |
| --- | --- |
| [`createPrinter`](/docs/5.x/reference/kit/ast#printers) | For an `overrides` map in practice, see the [custom codec example](/extensions/kubb-labs/plugin-zod/guides/customization#import-a-custom-codec). |
| [`ast.schema.isString`](/docs/5.x/reference/kit/ast#ast-schema) | Whether a schema prints as a plain `string`, including `date` and `time` with a string representation. |
| [`ast.graph.getImportedNames`](/docs/5.x/reference/kit/ast#ast-graph) | Pass `{ checks: true }` to include refs inside `conditionals`, `contains`, and `content`. |
| [`ast.http.groupParameters`](/docs/5.x/reference/kit/ast#ast-http) | The parameters by location (`path`, `query`, `header`, `cookie`), keeping the first of a repeated name. |
| [`ast.macro`](/docs/5.x/reference/kit/ast#macros) | A macro is a named transform that rewrites nodes before printing, with ordering through `enforce` and gating through `match`. |

## Ref imports in checks {#ref-imports-in-checks}

When your plugin prints checks such as `conditionals`, `contains`, or a string's `content`, pass `checks: true` to [`resolver.imports`](/docs/5.x/reference/kit/resolvers#imports). It then also imports the refs inside them.

Checks that cannot fail stay out: a `contains` with `min: 0` and no `max`, and `content` that is not JSON or is encoded.

## Printer compiler nodes {#printer-compiler-nodes}

When a TypeScript printer handler passes `this.transform(node)` to `ts.factory`, it breaks, because `this.transform(node)` returns a string. Build the type as a string instead. Source: [TypeScript handlers](/docs/5.x/how-to/customize#typescript-handlers).

> [!WARNING]
> Returning a compiler node from `typescript` 5 or later, or `@typescript/typescript6`, still works with `@kubb/parser-ts` installed. It is deprecated and goes away in the next major.

## Programmatic builds {#programmatic-builds}

When you build from code instead of the CLI, these rules apply. Sources: [`input`](/docs/5.x/reference/configuration#input) and [Engine](/docs/5.x/reference/kit/engine).

- `input` is required whenever an adapter is set, and `defineConfig` always sets one, so a config without `input` stops with [`KUBB_INPUT_REQUIRED`](/docs/5.x/reference/diagnostics#kubb-input-required).
- Only `createKubb` from `@kubb/core` runs without an adapter, in plugin-only mode.
- On `.generate()`, `options.processOutput` replaces the output passes.

[`Kubb.generate(configs)`](/docs/5.x/reference/kit/engine#kubb-generate) builds several configs:

- Configs build one after another, and each result is yielded when its config finishes, so memory holds one config at a time.
- A failing config does not stop the others. Its result has `success: false`, and `error` holds what it threw outside its diagnostics.
- Only an aborted `signal` rejects.
