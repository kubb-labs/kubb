---
layout: doc
title: Generators
description: defineGenerator declares a named generator that walks the AST and
  emits files. Covers the generator fields, match, the GeneratorContext each
  method receives, and the build-wide memo cache.
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

A generator walks the [AST](/docs/5.x/reference/kit/ast) and returns files for one plugin. Define it with `defineGenerator`, then register it in the plugin's `setup` with [`addGenerator`](/docs/5.x/reference/kit/extensions#setup-context).

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

`ctx.resolver.file` resolves the path inside the output folder, so this generator writes `operations/<operationId>.ts`. A plugin with an `output` option passes `ctx.options.output` instead of a fixed value.

### Generator fields {#generator-methods}

| Field        | Type                                              | Runs                                   | Use it for                                                       |
| ------------ | ------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `name`       | `string`                                          |                                        | Required. Shown in diagnostics and debug output.                 |
| `renderer`   | `RendererFactory \| null`                         |                                        | Needed when a method returns elements, such as JSX with [`jsxRenderer`](/docs/5.x/reference/jsx). |
| `match`      | `(node, ctx) => boolean \| Promise<boolean>`      | Before `schema` and `operation`        | Skipping nodes. See [Scoping with `match`](#match).              |
| `schema`     | `(node: SchemaNode, ctx) => Output`               | Once per schema                        | Types, validators, factories.                                    |
| `operation`  | `(node: OperationNode, ctx) => Output`            | Once per operation                     | Clients, hooks, handlers.                                        |
| `operations` | `(nodes: Array<OperationNode>, ctx) => Output`    | Once, after every operation            | Index or aggregate files.                                        |

`Output` is renderer elements, `Array<FileNode>`, `null`, or `undefined`, or a promise of one of them. To write files yourself, call `ctx.upsertFile()` and return nothing.

### Scoping with `match` {#match}

A `false` result skips `schema` or `operation` for that node. Without `match`, the generator runs for every node. `match` never filters `operations()`.

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

Each method receives `ctx`. These fields hold data:

| Field          | Type                       | Holds                                                                                                       |
| -------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ctx.config`   | `Config`                   | The resolved Kubb config.                                                                                   |
| `ctx.root`     | `string`                   | Absolute path of the current plugin's output folder.                                                        |
| `ctx.options`  | `TResolvedOptions`         | The options for this node, after `exclude`, `include`, and `override`. In `operations()`, the plugin's options. |
| `ctx.plugin`   | `Plugin`                   | The current plugin.                                                                                         |
| `ctx.resolver` | `Resolver`                 | The current plugin's [resolver](/docs/5.x/reference/kit/resolvers).                                         |
| `ctx.adapter`  | `Adapter`                  | The adapter that parsed the input.                                                                          |
| `ctx.meta`     | `InputMeta`                | Document metadata: `title`, `version`, `baseURL`, every `servers` entry, and the `auth` schemes.            |
| `ctx.hooks`    | `Hookable<KubbHooks>`      | The build's [hook](/docs/5.x/reference/kit/hooks) emitter.                                                  |
| `ctx.driver`   | `KubbDriver`               | The driver running the build. Prefer the helpers below.                                                     |
| `ctx.signal`   | `AbortSignal \| undefined` | Stops generation at the next safe checkpoint when aborted.                                                  |

These fields are helpers:

| Helper                | Signature                                                                  | Does                                                                                     |
| --------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `ctx.addFile()`       | `(...files: Array<FileNode>) => Promise<void>`                             | Adds files, skipping any that already exist.                                             |
| `ctx.upsertFile()`    | `(...files: Array<FileNode>) => Promise<void>`                             | Adds files, or merges their sources and imports into an existing file.                  |
| `ctx.getPlugin()`     | `(name: string) => Plugin \| undefined`                                    | Returns a plugin by name.                                                                |
| `ctx.requirePlugin()` | `(name: string) => Plugin`                                                 | Returns a plugin by name, or throws a descriptive error.                                 |
| `ctx.getResolver()`   | `(name: string) => Resolver`                                               | Returns another plugin's resolver.                                                       |
| `ctx.memo()`          | `(key: string, compute: () => T) => T`                                     | Caches a value for the whole build. See [Caching with `ctx.memo`](#memo).                |
| `ctx.info()`          | `(message: string, options?: { code?, help?, location? }) => void`         | Reports an `info` diagnostic for this plugin.                                            |
| `ctx.warn()`          | `(message: string, options?: { code?, help?, location? }) => void`         | Reports a `warning`. It shows in the run summary but does not fail the build.            |
| `ctx.error()`         | `(error: string \| Error, options?: { code?, help?, location? }) => void`  | Reports an `error`, which fails the build. A `Diagnostics.Error` keeps its code, help, and location. |

### Caching with `ctx.memo` {#memo}

`ctx.memo(key, compute)` runs `compute` the first time the build asks for `key`, then returns the stored value. Every plugin in the build shares the store, so pick keys with care:

- Start the key with your plugin name, such as `my-plugin:`, unless every plugin should share the value.
- When the value comes from one node, put the node in the key: `node.operationId` for an operation, `node.name` for a schema.
- For a value only your plugin reads, use `ctx.resolver.memo(key, compute)`.

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

The value stays in memory until the build ends, so store derived data, such as names or paths, not generated source.
