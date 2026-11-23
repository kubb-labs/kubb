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

## `defineTemplate` {#definetemplate}

A template writes your plugin's files for each node of one kind. Define it with `defineTemplate`, then register it in your plugin's `setup` with `addTemplate`.

```tsx [zodSchema.tsx]
import { addTemplate, defineExtension, defineTemplate } from 'kubb/kit'
import { File } from '@kubb/renderer-jsx'

export const zodSchema = defineTemplate({
  kind: 'Schema',
  render(node, ctx) {
    if (!node.name) return null
    return <File {...ctx.file(node)}>…</File>
  },
})

export const pluginZod = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-zod' },
  setup(options) {
    addTemplate(zodSchema)
    return options
  },
})
```

| `kind` | `render` gets | Runs |
| --- | --- | --- |
| `'Schema'` | A `SchemaNode` | Once per schema the plugin keeps |
| `'Operation'` | An `OperationNode` | Once per operation the plugin keeps |
| `'Operations'` | `Array<OperationNode>` | Once, after every operation |

`kind` types the node, so `render` needs no annotation. Type the context with the plugin: `defineTemplate<PluginZod>({ … })`. `render` gets the same context as a generator method, as its second argument, as `this` and as `useKubb()`.

- `render` returns JSX, a `FileNode`, `Array<FileNode>`, or `null` to skip the node. Kit renders JSX with `jsxRenderer`. Pass another renderer with `addTemplate(template, { renderer })`.
- Templates of one kind run in the order you add them. Kit prepares only the kinds a plugin has templates for.
- A template is a plain value. Import another plugin's template and pass it to `addTemplate`, or call its `render` from your own template.

> [!NOTE]
> `defineGenerator` and `addGenerator` are deprecated. Kit runs each generator as one template per method, so existing generators keep working.

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
| `renderer`   | `RendererFactory \| null`                      |                                 | Unset renders JSX with [`jsxRenderer`](/docs/5.x/reference/jsx). Set it for another renderer, or `null` to skip rendering. |
| `match`      | `(node, ctx) => boolean \| Promise<boolean>`   | Before `schema` and `operation` | Skipping nodes. See [`match`](#match).                                                            |
| `schema`     | `(node: SchemaNode, ctx) => Output`            | Once per schema                 | Types, validators, factories.                                                                     |
| `operation`  | `(node: OperationNode, ctx) => Output`         | Once per operation              | Clients, hooks, handlers.                                                                         |
| `operations` | `(nodes: Array<OperationNode>, ctx) => Output` | Once, after every operation     | Index or aggregate files.                                                                         |

`Output` is renderer elements, a `FileNode`, `Array<FileNode>`, `null`, or `undefined`, or a promise of one of them. A `FileNode` is stored as it is, even when `renderer` is set. To write files yourself, call `ctx.upsertFile()` and return nothing.

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
| `ctx.signal`     | `AbortSignal \| undefined`     | Stops generation at the next safe checkpoint.                                                                               |

`ctx` also has these helpers:

| Helper                | Signature                                                                 | Does                                                                                                 |
| --------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ctx.addFile()`       | `(...files: Array<FileNode>) => Promise<void>`                            | Adds files, skipping any that already exist.                                                         |
| `ctx.upsertFile()`    | `(...files: Array<FileNode>) => Promise<void>`                            | Adds files, or merges their sources and imports into an existing file.                               |
| `ctx.getFile()`       | `(path: string) => FileNode \| undefined`                                 | Returns the file at `path` as the build holds it now, such as one an earlier plugin wrote.           |
| `ctx.dispatch()`      | `({ result, renderer?, pointer? }) => Promise<void>`                      | Adds a generator result: files as they are, or elements through `renderer`.                          |
| `ctx.getPlugin()`     | `(name: string) => Plugin \| undefined`                                   | Returns a plugin by name.                                                                            |
| `ctx.requirePlugin()` | `(name: string) => Plugin`                                                | Returns a plugin by name, or throws.                                                                 |
| `ctx.getResolver()`   | `(name: string) => Resolver`                                              | Returns another plugin's resolver.                                                                   |
| `ctx.file()`          | `(node, options?) => FileTarget`                                          | Returns the `<File>` props for a node's file. See [`file`](#file).                                   |
| `ctx.from()`          | `(source?) => From`                                                       | Returns a plugin's resolver whose names carry their imports. See [`from`](#from).                    |
| `ctx.memo()`          | `(key: string, compute: () => T) => T`                                    | Caches a value for the whole build. See [`memo`](#memo).                                             |
| `ctx.info()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Reports an `info` diagnostic for this plugin.                                                        |
| `ctx.warn()`          | `(message: string, options?: { code?, help?, location? }) => void`        | Reports a `warning`, which does not fail the build.                                                  |
| `ctx.error()`         | `(error: string \| Error, options?: { code?, help?, location? }) => void` | Reports an `error`, which fails the build. A `Diagnostics.Error` keeps its code, help, and location. |

### Naming files with `file` {#file}

`file(node, options?)` returns the `<File>` props for the file a generator writes: `baseName`, `path`, `meta`, and the `banner` and `footer` from the plugin's `output`. Spread it onto `<File>`. It is a composable, so it reads the current generator context. `ctx.file(node)` and `this.file(node)` do the same.

- A schema's file is named after `node.name`, and an operation's file after `node.operationId`. Pass `name` to choose another name.
- An operation file that would land on a component schema's file, ignoring case, gets an `Operation` suffix: operation `point` goes to `pointOperation.ts`, next to schema `point.ts`. The declarations keep their names. Kit adds it only when the plugin has a schema generator, so a plugin that writes only operation files keeps the plain name.
- Pass `plugin` to get another plugin's file, such as the types to import. `file` then uses that plugin's resolver, `output` and `group`, after its `include`, `exclude` and `override` rules. A missing plugin reports `KUBB_PLUGIN_NOT_FOUND`.
- Outside a generator or a printer factory, `file()` reports `KUBB_NO_CONTEXT`.

```tsx [zodGenerator.tsx]
import { defineGenerator, file } from 'kubb/kit'
import { File } from '@kubb/renderer-jsx'

export const zodGenerator = defineGenerator({
  name: 'zod',
  operation(node) {
    const types = file(node, { plugin: 'plugin-ts' })

    return (
      <File {...file(node)}>
        <File.Import names={[{ name: 'Pet' }]} path={types.path} />
      </File>
    )
  },
})
```

### Importing names with `from` and `code` {#from}

`from(source?)` wraps a plugin's resolver, so each name it returns comes with its import from that plugin's file. Call it as `from(source)`, `ctx.from(source)` or `this.from(source)`.

`source` is one of:

- A plugin name, such as `'plugin-ts'`.
- A name a plugin offers with [`provide`](/docs/5.x/reference/kit/plugins#provide), such as `'types'`.
- Nothing, for the current plugin. `ctx.from()` is then typed with that plugin's resolver.

Any other `source` fails with `KUBB_PLUGIN_NOT_FOUND`.

| Member | Returns |
| --- | --- |
| `from(source).resolver` | The plugin's resolver. Each method that returns a name returns a `RefName`, `{ name, import }`, which prints as the name. |
| `from(source).ref(node, name)` | `name` with the import from the plugin's file for `node`. Use it for a name no resolver method returns, such as one from a shared helper. |

The first argument of a resolver method picks the file to import from:

- An operation node: the plugin's file for that operation, with the same `Operation` suffix as `file`.
- A schema node, `{ name }` or a schema name: the plugin's file for that schema. The schema must be in the document.
- Anything else, such as a status code: no import.

A name also gets no import when the result is not an identifier, such as a description, or when the plugin's `include` or `exclude` rules leave the node out.

You pass only the node. The target resolver's [`file.name`](/docs/5.x/reference/kit/resolvers#resolver-overrides) decides the file.

Imports are value imports. Set `space: 'type'` on the names you use only as types.

`code` is a template tag that returns `{ text, imports }`:

- Its placeholders (`${…}`) take names from `from`, other `code` results, strings and numbers.
- `null`, `undefined` and `false` print nothing, so `${cond && name}` works when `cond` is a boolean.
- `code.join(parts, separator)` joins several parts and keeps their imports.
- The imports come in the order of use. `<File>` merges the ones that share a path.

Import paths are absolute. Pass the file you write as `root`, so each path becomes relative to it:

```tsx [zodGenerator.tsx]
import { ast, code, defineGenerator, file, from } from 'kubb/kit'
import { Code, File } from '@kubb/renderer-jsx'

export const zodGenerator = defineGenerator({
  name: 'zod',
  schema(node) {
    if (!node.name) return null
    const target = file(node)
    const types = from('plugin-ts').resolver
    const source = code`export const ${node.name}Schema = z.object({}) satisfies z.ZodType<${types.name(node.name)}>`

    return (
      <File {...target}>
        <File.Import names={[{ name: 'z', space: 'value' }]} path="zod" />
        {source.imports.map((imp) => (
          <File.Import
            key={imp.path}
            names={ast.file.getNames(imp).map((item) => ({ ...item, space: 'type' }))}
            path={imp.path}
            root={target.path}
          />
        ))}
        <Code name={`${node.name}Schema`} export>
          {source.text}
        </Code>
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
