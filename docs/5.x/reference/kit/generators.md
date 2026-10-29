---
layout: doc
title: Generators
description: defineGenerator declares a named generator unit that walks the AST
  and emits files. Covers the schema, operation, and operations methods and the
  GeneratorContext passed to each.
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

`defineGenerator` declares a named generator unit consumed by a plugin. Generators walk the [AST](/docs/5.x/explanation/architecture#ast) and emit files. Kubb calls each method for the matching node type.

Each generator method returns `TElement | Array<FileNode> | void`. Returning a renderer element (for example JSX from [`kubb/jsx`](/docs/5.x/reference/jsx)) requires a `renderer` factory on the generator.

```typescript [my-generator.ts]
import { ast, defineGenerator } from 'kubb/kit'

const myGenerator = defineGenerator({
  name: 'my-generator',
  operation(node, ctx) {
    return [
      ast.factory.createFile({
        baseName: `${node.operationId}.ts`,
        path: `./${node.operationId}.ts`,
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

### Generator methods

| Method         | Input                                   | Output                                | When to use                                                      |
| -------------- | --------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `schema()`     | `SchemaNode` (per data schema)          | `TElement \| Array<FileNode> \| void` | Generate types, validators, factories. Called once per schema    |
| `operation()`  | `OperationNode` (per API operation)     | `TElement \| Array<FileNode> \| void` | Generate hooks, clients, handlers. Called once per operation     |
| `operations()` | `Array<OperationNode>` (all operations) | `TElement \| Array<FileNode> \| void` | Generate index or barrel files. Called once after all operations |

### Scoping with `match` {#match}

Add a `match(node, ctx)` predicate to skip `schema` or `operation` for nodes a generator does not apply to. A `false` result skips that node. Omitting `match` runs the generator for every node. `match` does not filter `operations()`.

```typescript [scoped-generator.ts]
import { ast, defineGenerator } from 'kubb/kit'

const getOnlyGenerator = defineGenerator({
  name: 'get-only-generator',
  match(node, ctx) {
    return node.kind === 'Operation' && ast.isHttpOperationNode(node) && node.method.toLowerCase() === 'get'
  },
  operation(node, ctx) {
    // node is already known to be a GET operation here
    return
  },
})
```

### `GeneratorContext` properties (the `ctx` argument passed to each method)

| Property              | Type                                                                      | Purpose                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `ctx.config`          | `Config`                                                                  | Resolved Kubb configuration                                                                                                                |
| `ctx.root`            | `string`                                                                  | Absolute path to the output directory for the current plugin                                                                               |
| `ctx.options`         | `TResolvedOptions`                                                        | Per-node resolved options (after exclude/include/override filtering)                                                                       |
| `ctx.plugin`          | `Plugin`                                                                  | The owning plugin descriptor                                                                                                               |
| `ctx.resolver`        | `Resolver`                                                                | Resolver for the current plugin                                                                                                            |
| `ctx.driver`          | `KubbDriver`                                                              | Plugin driver for cross-plugin access                                                                                                      |
| `ctx.hooks`           | `Hookable<KubbHooks>`                                                     | Event bus for `KubbHooks` events                                                                                                           |
| `ctx.adapter`         | `Adapter`                                                                 | The adapter that parsed the input spec                                                                                                     |
| `ctx.meta`            | `InputMeta`                                                               | Document metadata from the adapter. Carries `title`, `version`, `baseURL`, and every declared `servers` entry and `securitySchemes` entry. |
| `ctx.memo()`          | `(key: string, compute: () => T) => T`                                    | Cache that lives for the whole build and is shared by every plugin. See [Caching with `ctx.memo`](#memo)                                   |
| `ctx.addFile()`       | `(...files: FileNode[]) => Promise<void>`                                 | Add files, skipping any that already exist                                                                                                 |
| `ctx.upsertFile()`    | `(...files: FileNode[]) => Promise<void>`                                 | Add or merge files (concatenates sources and imports)                                                                                      |
| `ctx.getPlugin()`     | `(name: string) => Plugin \| undefined`                                   | Get a plugin by name                                                                                                                       |
| `ctx.requirePlugin()` | `(name: string) => Plugin`                                                | Get a plugin by name or throw a descriptive error                                                                                          |
| `ctx.getResolver()`   | `(name: string) => Resolver`                                              | Get a resolver by plugin name                                                                                                              |
| `ctx.info()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Emit an info message via the build event system                                                                                            |
| `ctx.warn()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Emit a warning via the build event system. `options` sets the fix and the source pointer                                                   |
| `ctx.error()`         | `(error: string \| Error, options?: { code?, help?, location? }) => void` | Emit an error via the build event system. A `Diagnostics.Error` keeps its code, help, and location                                         |

### Caching with `ctx.memo` {#memo}

`ctx.memo(key, compute)` runs `compute` the first time a build asks for `key` and returns the stored value after that. Every plugin in the build shares the store, so name the key with care:

- Start the key with your plugin name, such as `my-plugin:`, unless every plugin should share the value.
- Put the node in the key when the value comes from one node: `node.operationId` for an operation, `node.name` for a schema.
- Use `ctx.resolver.memo(key, compute)` for a value only your own plugin reads.

```typescript [memo-generator.ts]
import { ast, defineGenerator } from 'kubb/kit'

export const operationGenerator = defineGenerator({
  name: 'operation-generator',
  operation(node, ctx) {
    // One entry per operation. Other generators that ask for the same key reuse it.
    const schemas = ctx.memo(`my-plugin:schemas:${node.operationId}`, () => ast.collectSync<ast.SchemaNode>(node, { depth: 'shallow', schema: (schema) => schema }))

    return
  },
})
```

The value stays in memory until the build ends, so store derived data such as names or paths rather than generated source.
