---
layout: doc
title: Shared plugin options
description: The output, group, include, exclude, override, resolver and macros options that every Kubb generator plugin accepts, with their types, defaults and behavior.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Shared plugin options
  icon: i-iconoir-settings
---

# Shared plugin options

Every generator plugin accepts the options on this page. A plugin's own options page lists only the default it gives each one and links here for the behavior.

`@kubb/plugin-barrel` is the exception: it takes no arguments and is configured through [`output.barrel`](#output-barrel). `@kubb/plugin-redoc` accepts only `output.path`.

## output {#output}

Where the plugin writes its files and how they are exported.

| | |
| --- | --- |
| Type | `Output` |
| Required | `false` |
| Default | Set by each plugin, for example `{ path: 'types', barrel: { type: 'named' } }` for `@kubb/plugin-ts` |

An `output` you pass replaces the plugin default as a whole. Repeat `barrel` when you set `output` yourself, or the plugin falls back to `config.output.barrel`.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  output: {
    path: 'models',
    barrel: { type: 'named' },
    banner: '/* eslint-disable */',
  },
})
```

### output.path {#output-path}

Folder where the plugin writes its files, resolved against the global `output.path` on `defineConfig`. For a single file, give `path` a name with its extension, such as `'types.ts'`.

| | |
| --- | --- |
| Type | `string` |
| Required | `true` when `output` is set |
| Default | Set by each plugin |

### output.mode {#output-mode}

How generated code is consolidated into files.

| | |
| --- | --- |
| Type | `'directory' \| 'file'` |
| Required | `false` |
| Default | `'file'` when `output.path` has an extension, `'directory'` otherwise |

::field-group

:::field{name="'directory'"}
Writes one file per operation or schema under `output.path`. Use `group` to split those files into subfolders.
:::

:::field{name="'file'"}
Writes everything into a single file. `output.path` must include the file extension, such as `'types.ts'`.
:::

::

Leave `mode` unset and Kubb reads it from `output.path`. Set `mode: 'directory'` only to override that inference, for example for a directory name that carries a dot such as `'clients.v2'`.

> [!IMPORTANT]
> `group` needs directory output. Combining `group` with `mode: 'file'` stops the build with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options).

### output.barrel {#output-barrel}

Controls how generated `index.ts` files re-export the plugin's output. Toggle the export style and depth to see the generated barrels.

::barrel-tree
::

| | |
| --- | --- |
| Type | `{ type: 'all' \| 'named', nested?: boolean, namespace?: boolean } \| false` |
| Required | `false` |
| Default | `{ type: 'named' }` from the plugin's default `output`, `false` once you pass your own `output` without `barrel` |

::field-group

:::field{name="'named'"}
Re-exports each symbol by name. Use `{ type: 'named' }` for explicit imports and tree-shaking.
:::

:::field{name="'all'"}
Re-exports every symbol with `export *`. Use `{ type: 'all' }` for wildcard exports.
:::

:::field{name="false"}
Skips barrel generation for this plugin and drops its files from the root barrel.
:::

::

Add `nested: true`, for example `{ type: 'named', nested: true }`, to write an `index.ts` in every subdirectory that re-exports only what sits directly inside it. The root `output.barrel` on `defineConfig` has no `nested` field.

Add `namespace: true` on a plugin's barrel to expose each immediate group as a named namespace, alongside the standalone exports. This enables nested barrels. For tag-grouped fetch clients, use `group.name` to produce names such as `PetService`, then import `{ PetService }` from the client barrel. Leave fetch `sdk` unset when generating query hooks or options. See the [fetch + React Query example](/extensions/kubb-labs/plugin-barrel/options#namespace).

Kubb reads the plugin's own `output.barrel` first, falls back to `config.output.barrel` on `defineConfig`, and finally to `false`. See [`@kubb/plugin-barrel` options](/extensions/kubb-labs/plugin-barrel/options) for the `type`, `nested`, and `namespace` fields in detail.

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({ output: { path: 'zod', barrel: { type: 'all', nested: true } } })
```

### output.banner {#output-banner}

Text added to the top of every generated file, such as a license header or a `@ts-nocheck` directive.

| | |
| --- | --- |
| Type | `string \| ((meta: BannerMeta) => string)` |
| Required | `false` |

A string is applied to every file, barrels included. A function receives the document info (`title`, `description`, `version`, `baseURL`) and per-file context (`filePath`, `baseName`, `isBarrel`, `isAggregation`), so a directive can skip barrel files.

```typescript [kubb.config.ts]
import { pluginFetch } from '@kubb/plugin-fetch'

pluginFetch({
  output: {
    path: 'clients',
    banner: (meta) => (meta.isBarrel || meta.isAggregation ? '' : "'use server'"),
  },
})
```

### output.footer {#output-footer}

Text added to the bottom of every generated file, like `banner` but for closing comments.

| | |
| --- | --- |
| Type | `string \| ((meta: BannerMeta) => string)` |
| Required | `false` |

Pair `banner: '/* eslint-disable */'` with `footer: '/* eslint-enable */'` to scope a lint disable to the generated file.

## group {#group}

Splits generated files into subfolders by the operation's tag or URL path, each under `{output.path}/{groupName}/`. Without `group`, every file lands directly in `output.path`.

Combine tag grouping with [`output.barrel.namespace`](#output-barrel) to expose each group as a named service while retaining standalone operation imports.

| | |
| --- | --- |
| Type | `{ type: 'tag' \| 'path', name?: (context: { group: string }) => string }` |
| Required | `false` |
| Default | No grouping |

Switch the mode to see where these operations land on disk.

::grouping-diagram
::

`group` applies only to `output.mode: 'directory'`. Combining it with `output.mode: 'file'` stops the build with `KUBB_INVALID_PLUGIN_OPTIONS`.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({ group: { type: 'tag' } }) // src/gen/types/pet/, src/gen/types/store/, ...
```

### group.type {#group-type}

Property used to assign each operation to a group. An operation with no tag goes in the `default` group.

| | |
| --- | --- |
| Type | `'tag' \| 'path'` |
| Required | `true` when `group` is set |

::field-group

:::field{name="'tag'"}
Uses the operation's first tag.
:::

:::field{name="'path'"}
Uses the first URL segment, such as `pet` for `/pet/{petId}`.
:::

::

### group.name {#group-name}

Turns the group key into the subfolder name, also used as the suffix on aggregate files. A `group.name` you pass always wins over the default.

| | |
| --- | --- |
| Type | `(context: { group: string }) => string` |
| Required | `false` |
| Default | `'tag'` groups camelCase the tag (`pet store` becomes `petStore`), `'path'` groups keep the raw URL segment |

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  group: {
    type: 'tag',
    name: ({ group }) => `${group}Api`, // src/gen/types/petApi/
  },
})
```

## include {#include}

Generates only the operations and schemas that match at least one entry, and skips the rest.

| | |
| --- | --- |
| Type | `Array<Include>` |
| Required | `false` |
| Default | Everything is generated |

Each entry filters by `tag`, `operationId`, `path`, `method`, `contentType`, or `schemaName`, with a `pattern` that is a string or a `RegExp`. A string is compiled with `new RegExp(pattern)`, so it is not an exact match: `pattern: 'pet'` also matches `'petType'` and `'superpet'`. Anchor it (`'^pet$'`) for an exact match. For `type: 'method'`, a string pattern is an uppercase HTTP method such as `'GET'`.

An `extension` entry matches operations by a vendor extension on the source operation instead of a pattern: `key` is the `x-*` key, and the optional `value` must be strictly equal. Without `value`, the key being present is enough. It does not apply to schemas.

```typescript [Type definition]
export type Include =
  | {
      type: 'tag' | 'operationId' | 'path' | 'method' | 'contentType' | 'schemaName'
      pattern: string | RegExp
    }
  | {
      type: 'extension'
      key: `x-${string}`
      value?: unknown
    }
```

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  include: [
    { type: 'tag', pattern: 'pet' },
    { type: 'path', pattern: /^\/store/ },
  ],
})
```

## exclude {#exclude}

Skips any operation or schema that matches at least one entry, the opposite of `include`.

| | |
| --- | --- |
| Type | `Array<Exclude>` |
| Required | `false` |
| Default | `[]` |

Entries use the same fields as `include`. When both options match an item, `exclude` wins.

When a client plugin (`@kubb/plugin-fetch` or `@kubb/plugin-axios`) excludes operations, the plugins that build on it (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, `@kubb/plugin-mcp`) skip those operations too, so you do not repeat the `exclude` list.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  exclude: [
    { type: 'tag', pattern: 'internal' },
    { type: 'operationId', pattern: /^deprecated_/ },
    { type: 'extension', key: 'x-internal', value: true },
  ],
})
```

## override {#override}

Applies different plugin options to operations that match a pattern.

| | |
| --- | --- |
| Type | `Array<Override>` |
| Required | `false` |
| Default | `[]` |

Each entry takes the same fields as an `include` entry, plus an `options` object that accepts any plugin option except `override`, so rules cannot nest. Entries are checked top to bottom. The first match merges onto the plugin defaults, and later entries do not stack.

```typescript [Type definition]
export type Override = Include & {
  options: Omit<Partial<Options>, 'override'>
}
```

When a client plugin overrides `returnType`, `output`, or `group` for an operation, the plugins that build on it (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, `@kubb/plugin-mcp`) follow those per-operation options.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  override: [
    {
      type: 'tag',
      pattern: 'admin',
      options: { output: { path: 'admin' }, enum: { type: 'enum' } },
    },
  ],
})
```

## resolver {#resolver}

Overrides how the plugin names generated files and symbols. Members you omit keep the plugin's own resolver.

| | |
| --- | --- |
| Type | `ResolverPatch<Resolver>`, parameterized by each plugin with its own resolver type such as `ResolverPatch<ResolverTs>` |
| Required | `false` |

Every resolver shares the members below. A plugin adds namespaces of its own, such as `param` and `response` on `@kubb/plugin-ts` or `query` and `mutation` on `@kubb/plugin-react-query`, listed on that plugin's options page. Inside a method `this` is the full resolver, so `this.default.name(name)` reuses the built-in casing. See [Customize names and paths](/docs/5.x/how-to/resolvers) for how a patch layers over the default.

```typescript [Shared members]
type ResolverPatch = {
  name?(name: string): string
  file?: {
    baseName?(params: { name: string; extname: string }): string
    path?(params: { baseName: string; output: Output }): string
  }
  imports?(options: ResolveImportsOptions): Array<ImportNode>
}
```

`name` cases an identifier, `file.baseName` and `file.path` decide where a file lands, and `imports` builds the import statements for the `$ref` schemas a node uses.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    name(name) {
      return `${this.default.name(name)}Model`
    },
  },
})
```

## macros {#macros}

Rewrites AST nodes before they are printed, without forking the generator.

| | |
| --- | --- |
| Type | `Array<Macro>` |
| Required | `false` |
| Default | `[]` |

Each [macro](/docs/5.x/how-to/macros) callback, such as `schema` or `operation`, receives the node and a context object and returns a replacement or `undefined` to leave it as is. Macros run in order, so a later one sees the output of an earlier one. The client plugins (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, `@kubb/plugin-client`) run their built-in macros first and yours after them.

The built-in macros `macroDiscriminatorEnum`, `macroEnumName`, `macroRenameSchema` and `macroSimplifyUnion` are exported from `kubb/kit`. See [Macros](/docs/5.x/reference/kit/ast#macros) for the `Macro` type and its callbacks.

```typescript [kubb.config.ts]
import { ast } from 'kubb/kit'
import { pluginTs } from '@kubb/plugin-ts'

const macroUntagged = ast.defineMacro({
  name: 'untagged',
  operation(node) {
    return node.tags?.length ? undefined : { ...node, tags: ['untagged'] }
  },
})

pluginTs({ macros: [macroUntagged] })
```
