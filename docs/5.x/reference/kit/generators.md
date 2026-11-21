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

Each method, `match` included, gets `ctx` with these fields. Kit runs each one through [`withContext`](/docs/5.x/reference/kit/plugins), so `this`, `ctx` and `useKubb()` are the same generator context, and composables such as `useConfig()` and `memo()` work there. Setup-only composables such as `addGenerator` report `KUBB_NO_CONTEXT`.

| Field            | Type                           | Holds                                                                                                                       |
| ---------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `ctx.config`     | `Config`                       | The resolved Kubb config.                                                                                                   |
| `ctx.root`       | `string`                       | Absolute path of the root output folder, the same for every plugin.                                                         |
| `ctx.options`    | `TResolvedOptions`             | The node's options after `exclude`, `include`, and `override`. In `operations()`, the plugin's options.                     |
| `ctx.plugin`     | `Plugin`                       | The current plugin.                                                                                                         |
| `ctx.resolver`   | `Resolver`                     | The current plugin's [resolver](/docs/5.x/reference/kit/resolvers).                                                         |
| `ctx.printer`    | `Printer \| undefined`         | The printer from the plugin's [`setPrinter`](/docs/5.x/reference/kit/plugins#printer) factory, or `undefined` without one.  |
| `ctx.adapter`    | `Adapter`                      | The adapter that parsed the input.                                                                                          |
| `ctx.meta`       | `InputMeta`                    | Document metadata: `title`, `version`, `baseURL`, `servers`, and the `auth` schemes.                                        |
| `ctx.schemas`    | `ReadonlyArray<SchemaNode>`    | Every schema in the spec, in adapter order. The OpenAPI adapter puts a referenced schema first, except in reference cycles. |
| `ctx.operations` | `ReadonlyArray<OperationNode>` | Every operation in the spec, in adapter order.                                                                              |
| `ctx.hooks`      | `Hookable<KubbHooks>`          | The build's [hook](/docs/5.x/reference/kit/hooks) emitter.                                                                  |
| `ctx.driver`     | `KubbDriver`                   | Deprecated. Use `ctx.schemas`, `ctx.operations` and the helpers below.                                                      |
| `ctx.signal`     | `AbortSignal \| undefined`     | Stops generation at the next safe checkpoint.                                                                               |

`ctx` also has these helpers:

| Helper                | Signature                                                                 | Does                                                                                                 |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ctx.addFile()`       | `(...files: Array<FileNode>) => Promise<void>`                            | Adds files, skipping any that already exist.                                                         |
| `ctx.upsertFile()`    | `(...files: Array<FileNode>) => Promise<void>`                            | Adds files, or merges their sources and imports into an existing file.                               |
| `ctx.dispatch()`      | `({ result, renderer?, pointer? }) => Promise<void>`                      | Adds a generator result: files as they are, or elements through `renderer`.                          |
| `ctx.getPlugin()`     | `(name: string) => Plugin \| undefined`                                   | Returns a plugin by name.                                                                            |
| `ctx.requirePlugin()` | `(name: string) => Plugin`                                                | Returns a plugin by name, or throws.                                                                 |
| `ctx.getResolver()`   | `(name: string) => Resolver`                                              | Returns another plugin's resolver.                                                                   |
| `ctx.file()`          | `(node, options?) => FileTarget`                                          | Returns the `<File>` props for a node's file. See [`file`](#file).                                   |
| `ctx.memo()`          | `(key: string, compute: () => T) => T`                                    | Caches a value for the whole build. See [`memo`](#memo).                                             |
| `ctx.info()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Reports an `info` diagnostic for this plugin.                                                        |
| `ctx.warn()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Reports a `warning`, which does not fail the build.                                                  |
| `ctx.error()`         | `(error: string \| Error, options?: { code?, help?, location? }) => void` | Reports an `error`, which fails the build. A `Diagnostics.Error` keeps its code, help, and location. |

### Naming files with `file` {#file}

`file(node, options?)` returns the `<File>` props for the file a generator writes: `baseName`, `path`, `meta`, and the `banner` and `footer` from the plugin's `output`. Spread it onto `<File>`. It is a composable, so it reads the current generator context. `ctx.file(node)` and `this.file(node)` do the same.

- A schema's file is named after `node.name`, and an operation's file after `node.operationId`. Pass `name` to choose another name.
- An operation file that would land on a component schema's file, ignoring case, gets an `Operation` suffix: operation `point` goes to `pointOperation.ts`, next to schema `point.ts`. The declarations keep their names. Pass `suffix: false` to keep the plain name, for files that never share a folder with schema files.
- Pass `plugin` to get another plugin's file, such as the types to import. `file` then uses that plugin's resolver, `output` and `group`, after its `include`, `exclude` and `override` rules. A missing plugin reports `KUBB_PLUGIN_NOT_FOUND`.
- Outside a generator or a printer factory, `file()` reports `KUBB_NO_CONTEXT`.

```tsx [zodGenerator.tsx]
import { defineGenerator, file } from 'kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'

export const zodGenerator = defineGenerator({
  name: 'zod',
  renderer: jsxRenderer,
  operation(node) {
    const types = file(node, { plugin: 'plugin-ts' })

    return (
      <File {...file(node)}>
        <File.Import name={['Pet']} path={types.path} isTypeOnly />
      </File>
    )
  },
})
```

### Importing names with `from` and `code` {#from}

`from(source?)` reads another plugin from the current generator context. `source` is a plugin name, or a provided name such as `'types'` that reads whichever plugin [`provide`](/docs/5.x/reference/kit/plugins#provide)s it. Without `source`, it reads the current plugin. `from(plugin).resolver` wraps that plugin's resolver: each method that returns a name returns the name plus its import from that plugin's file.

The method's first argument picks the file to import from:

- An operation node points at the plugin's file for that operation, with the same `Operation` suffix as `file`.
- A schema node, `{ name }` or a schema name points at the plugin's file for that schema. The name must belong to a schema in the document.
- Any other argument gives the name without an import.

A node that the plugin's `include` or `exclude` rules leave out also gives no import, and `from(plugin).has(node)` returns `false` for it. Imports are value imports. Pass `isTypeOnly` on the `<File.Import>` where you use the names only as types. The target resolver's [`file.name`](/docs/5.x/reference/kit/resolvers#resolver-overrides) decides its file, so you pass only the node.

For a name that no resolver method returns, such as one built by a shared helper, use `from(plugin).import(node, name)`. It imports `name` from the plugin's file for `node`.

`code` is a template tag that returns `{ text, imports }`. Its placeholders (`${…}`) take names from `from`, other `code` results, strings and numbers. `null`, `undefined` and `false` print nothing, so `${cond && name}` works when `cond` is a boolean. The imports are grouped per path, in the order of first use. `code.join(parts, separator)` joins several parts and keeps their imports.

The import paths are absolute. Pass the file you write as `root`, so each path becomes relative to it:

```tsx [zodGenerator.tsx]
import { code, defineGenerator, file, from } from 'kubb/kit'
import { File, jsxRenderer } from '@kubb/renderer-jsx'

export const zodGenerator = defineGenerator({
  name: 'zod',
  renderer: jsxRenderer,
  schema(node) {
    if (!node.name) return null
    const target = file(node)
    const types = from('plugin-ts').resolver
    const source = code`export const petSchema = z.object({}) satisfies z.ZodType<${types.name(node.name)}>`

    return (
      <File {...target}>
        <File.Import name={['z']} path="zod" />
        {source.imports.map((imp) => (
          <File.Import key={imp.path} root={target.path} name={imp.name} path={imp.path} isTypeOnly />
        ))}
        <File.Source>{source.text}</File.Source>
      </File>
    )
  },
})
```

### Caching with `memo` {#memo}

`memo(key, compute)` runs `compute` once per `key` and build, then returns the stored value. It is a composable, so it reads the current context. `ctx.memo(key, compute)` and `this.memo(key, compute)` do the same. Every plugin shares the store, so:

- Prefix the key with your plugin name, such as `my-plugin:`, unless every plugin should share the value.
- Put the node in the key for a value from one node: `node.operationId` or `node.name`.
- Use `ctx.resolver.memo(key, compute)` for a value only your plugin reads.

```typescript [memo-generator.ts]
import { ast, defineGenerator, memo } from 'kubb/kit'

export const operationGenerator = defineGenerator({
  name: 'operation-generator',
  operation(node) {
    // One entry per operation. Other generators that ask for the same key reuse it.
    const schemas = memo(`my-plugin:schemas:${node.operationId}`, () =>
      ast.node.collect<ast.SchemaNode>(node, { depth: 'shallow', schema: (schema) => schema }),
    )

    return
  },
})
```

> [!WARNING]
> The value stays in memory until the build ends. Store derived data, such as names or paths, not generated source.
