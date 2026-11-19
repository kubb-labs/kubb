---
layout: doc
title: Generators - Emit files with defineGenerator
description: defineGenerator declares a generator that walks the AST and emits files. Covers its fields, match, the GeneratorContext, and the memo cache.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Generators
  icon: i-iconoir-code-brackets
---

# Generators

## `defineGenerator` {#definegenerator}

A generator turns [AST](/docs/5.x/reference/kit/ast) nodes into files for your plugin. Define it with `defineGenerator`, then register it in your plugin's `setup` with [`addGenerator`](/docs/5.x/reference/kit/plugins#setup-context).

```typescript [my-generator.ts]
import { ast, defineGenerator } from 'kubb/kit'

const myGenerator = defineGenerator({
  name: 'my-generator',
  operation(node, ctx) {
    const file = ctx.resolver.file({
      name: node.operationId,
      extname: '.ts',
      root: ctx.root,
      output: { path: 'operations', mode: 'directory' },
    })

    return [
      ast.factory.createFile({
        baseName: file.baseName,
        path: file.path,
        sources: [
          ast.factory.createSource({
            nodes: [ast.factory.createText(`export const op = '${node.operationId}'`)],
          }),
        ],
      }),
    ]
  },
})
```

This generator writes `operations/<operationId>.ts` in the output folder. When your plugin has an `output` option, pass `ctx.options.output` instead of a fixed value.

### Generator fields {#generator-methods}

| Field        | Type                                           | Runs                            | Use it for                                                                                        |
| ------------ | ---------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `name`       | `string`                                       |                                 | Required. Shown in diagnostics.                                                                   |
| `renderer`   | `RendererFactory \| null`                      |                                 | Needed when a method returns elements, such as JSX with [`jsxRenderer`](/docs/5.x/reference/jsx). |
| `match`      | `(node, ctx) => boolean \| Promise<boolean>`   | Before `schema` and `operation` | Skipping nodes. See [`match`](#match).                                                            |
| `schema`     | `(node: SchemaNode, ctx) => Output`            | Once per schema                 | Types, validators, factories.                                                                     |
| `operation`  | `(node: OperationNode, ctx) => Output`         | Once per operation              | Clients, hooks, handlers.                                                                         |
| `operations` | `(nodes: Array<OperationNode>, ctx) => Output` | Once, after every operation     | Index or aggregate files.                                                                         |

`Output` is renderer elements, `Array<FileNode>`, `null`, or `undefined`, or a promise of one of them. To write files yourself, call `ctx.upsertFile()` and return nothing.

### Scoping with `match` {#match}

Return `false` to skip `schema` or `operation` for a node. `match` never filters `operations()`.

```typescript [scoped-generator.ts]
import { ast, defineGenerator } from 'kubb/kit'

const getOnlyGenerator = defineGenerator({
  name: 'get-only-generator',
  match: (node) => node.kind === 'Operation' && ast.http.isOperation(node) && node.method === 'GET',
  operation(node, ctx) {
    // node is a GET operation here
    return
  },
})
```

### `GeneratorContext` {#generatorcontext}

Each method gets `ctx` with these fields:

| Field          | Type                        | Holds                                                                                                                       |
| -------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ctx.config`   | `Config`                    | The resolved Kubb config.                                                                                                   |
| `ctx.root`     | `string`                    | Absolute path of the root output folder, the same for every plugin.                                                         |
| `ctx.options`  | `TResolvedOptions`          | The node's options after `exclude`, `include`, and `override`. In `operations()`, the plugin's options.                     |
| `ctx.plugin`   | `Plugin`                    | The current plugin.                                                                                                         |
| `ctx.resolver` | `Resolver`                  | The current plugin's [resolver](/docs/5.x/reference/kit/resolvers).                                                         |
| `ctx.adapter`  | `Adapter`                   | The adapter that parsed the input.                                                                                          |
| `ctx.meta`     | `InputMeta`                 | Document metadata: `title`, `version`, `baseURL`, `servers`, and the `auth` schemes.                                        |
| `ctx.schemas`  | `ReadonlyArray<SchemaNode>` | Every schema in the spec, in adapter order. The OpenAPI adapter puts a referenced schema first, except in reference cycles. |
| `ctx.hooks`    | `Hookable<KubbHooks>`       | The build's [hook](/docs/5.x/reference/kit/hooks) emitter.                                                                  |
| `ctx.driver`   | `KubbDriver`                | Deprecated. Use `ctx.schemas` and the helpers below.                                                                        |
| `ctx.signal`   | `AbortSignal \| undefined`  | Stops generation at the next safe checkpoint.                                                                               |

`ctx` also has these helpers:

| Helper                | Signature                                                                 | Does                                                                                                 |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ctx.addFile()`       | `(...files: Array<FileNode>) => Promise<void>`                            | Adds files, skipping any that already exist.                                                         |
| `ctx.upsertFile()`    | `(...files: Array<FileNode>) => Promise<void>`                            | Adds files, or merges their sources and imports into an existing file.                               |
| `ctx.getPlugin()`     | `(name: string) => Plugin \| undefined`                                   | Returns a plugin by name.                                                                            |
| `ctx.requirePlugin()` | `(name: string) => Plugin`                                                | Returns a plugin by name, or throws.                                                                 |
| `ctx.getResolver()`   | `(name: string) => Resolver`                                              | Returns another plugin's resolver.                                                                   |
| `ctx.memo()`          | `(key: string, compute: () => T) => T`                                    | Caches a value for the whole build. See [`ctx.memo`](#memo).                                         |
| `ctx.info()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Reports an `info` diagnostic for this plugin.                                                        |
| `ctx.warn()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Reports a `warning`, which does not fail the build.                                                  |
| `ctx.error()`         | `(error: string \| Error, options?: { code?, help?, location? }) => void` | Reports an `error`, which fails the build. A `Diagnostics.Error` keeps its code, help, and location. |

### Caching with `ctx.memo` {#memo}

`ctx.memo(key, compute)` runs `compute` once per `key` and build, then returns the stored value. Every plugin shares the store, so:

- Prefix the key with your plugin name, such as `my-plugin:`, unless every plugin should share the value.
- Put the node in the key for a value from one node: `node.operationId` or `node.name`.
- Use `ctx.resolver.memo(key, compute)` for a value only your plugin reads.

```typescript [memo-generator.ts]
import { ast, defineGenerator } from 'kubb/kit'

export const operationGenerator = defineGenerator({
  name: 'operation-generator',
  operation(node, ctx) {
    // One entry per operation. Other generators that ask for the same key reuse it.
    const schemas = ctx.memo(`my-plugin:schemas:${node.operationId}`, () =>
      ast.node.collect<ast.SchemaNode>(node, { depth: 'shallow', schema: (schema) => schema }),
    )

    return
  },
})
```

> [!WARNING]
> The value stays in memory until the build ends. Store derived data, such as names or paths, not generated source.

### File helpers: `getFile` and `getFileLocation` {#file-helpers}

Two functions from `kubb/kit` read the file settings from `ctx`, so a generator does not repeat them:

| Function               | Returns                                    | Use for                                                                                                           |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `getFileLocation(ctx)` | `{ root, output, group }`                  | The location arguments of `ctx.resolver.file()` and `ctx.resolver.imports()`. A `null` group becomes `undefined`. |
| `getFile(ctx, file)`   | `{ baseName, path, meta, banner, footer }` | The props of a `<File>` or `ast.factory.createFile()`, with the banner and footer from `output`.                  |

Both read `ctx.options`, so an `override` that changes `output` applies to the node it matches. They need a plugin whose resolved options have `output`, such as one built on `ResolvedPluginOptions`.

```typescript [file-generator.ts]
import { ast, defineGenerator, getFile, getFileLocation } from 'kubb/kit'
import type { PluginType, ResolvedPluginOptions } from 'kubb/kit'

interface ResolvedOptions extends ResolvedPluginOptions<ResolvedOptions> {}
type MyPlugin = PluginType<'my-plugin', object, ResolvedOptions>

export const fileGenerator = defineGenerator<MyPlugin>({
  name: 'file-generator',
  operation(node, ctx) {
    const file = ctx.resolver.file({ name: node.operationId, extname: '.ts', ...getFileLocation(ctx) })

    return [
      ast.factory.createFile({
        ...getFile(ctx, file),
        sources: [
          ast.factory.createSource({
            nodes: [ast.factory.createText(`export const op = '${node.operationId}'`)],
          }),
        ],
      }),
    ]
  },
})
```
