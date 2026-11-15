---
layout: doc
title: Shared plugin options
description: The output, group, include, exclude, override, resolver, and macros options every Kubb generator plugin accepts, with their types, defaults, matching rules, and precedence.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Shared plugin options
  icon: i-iconoir-settings
---

# Shared plugin options

Every generator plugin accepts the options on this page. A plugin's own options page gives only its default for each one. `@kubb/plugin-barrel` takes no options and reads [`output.barrel`](#output-barrel) instead, and `@kubb/plugin-redoc` accepts only `output.path`.

| Option | Type | Default |
| --- | --- | --- |
| [`output`](#output) | `Output` | Set by each plugin |
| ↳ [`output.path`](#output-path) | `string`, required in `output` | Set by each plugin |
| ↳ [`output.mode`](#output-mode) | `'directory' \| 'file'` | Read from `output.path` |
| ↳ [`output.barrel`](#output-barrel) | `{ type: 'all' \| 'named', nested?: boolean, namespace?: boolean } \| false` | `{ type: 'named' }` in the plugin's default `output` |
| ↳ [`output.banner`](#output-banner) | `string \| ((meta: BannerMeta) => string)` | The [default banner](/docs/5.x/reference/configuration#outputdefaultbanner) |
| ↳ [`output.footer`](#output-footer) | `string \| ((meta: BannerMeta) => string)` | None |
| [`group`](#group) | `{ type: 'tag' \| 'path', name?: (context: { group: string }) => string }` | No grouping |
| [`include`](#include) | `Array<Include>` | Everything |
| [`exclude`](#exclude) | `Array<Exclude>` | `[]` |
| [`override`](#override) | `Array<Override>` | `[]` |
| [`resolver`](#resolver) | `ResolverPatch<Resolver>`, such as `ResolverPatch<ResolverTs>` | The plugin's resolver |
| [`macros`](#macros) | `Array<Macro>` | `[]` |

## output {#output}

Where the plugin writes its files and how they are exported. Each plugin sets a default, such as `{ path: 'types', barrel: { type: 'named' } }` for `@kubb/plugin-ts`.

An `output` you pass replaces the plugin default as a whole. Repeat `barrel` in it, or the plugin falls back to the root `output.barrel`, which is `false` unless you set it.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  output: { path: 'models', barrel: { type: 'named' }, banner: '/* eslint-disable */' },
})
```

### output.path {#output-path}

The plugin's folder, resolved inside the root `output.path`. Required whenever you set `output`. For a single file, include the extension, such as `'types.ts'`.

### output.mode {#output-mode}

How the plugin splits its code into files. Default: `'file'` when `output.path` has an extension, `'directory'` otherwise.

::field-group

:::field{name="'directory'"}
Writes one file per operation or schema under `output.path`. Add [`group`](#group) to split them into subfolders.
:::

:::field{name="'file'"}
Writes everything into one file. `output.path` must include the extension, such as `'types.ts'`.
:::

::

Plugin defaults such as `'types'` have no extension, so they write a directory. Set `mode: 'directory'` only for a folder name with a dot, such as `'clients.v2'`.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [
    pluginTs({ output: { path: 'types.ts' } }), // src/gen/types.ts
    pluginAxios({ output: { path: 'clients' }, group: { type: 'tag' } }), // src/gen/clients/pet/, src/gen/clients/store/
  ],
})
```

> [!IMPORTANT]
> `group` needs directory output. A `group` with file output, set or read from an extension, stops the build with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options).

### output.barrel {#output-barrel}

How the plugin's `index.ts` files re-export its output. Toggle the export style and depth to see the generated barrels.

::barrel-tree
::

::field-group

:::field{name="'named'"}
`{ type: 'named' }` re-exports each symbol by name, for explicit imports and tree-shaking.
:::

:::field{name="'all'"}
`{ type: 'all' }` re-exports every file with `export *`.
:::

:::field{name="false"}
Writes no barrel for this plugin and leaves its files out of the root barrel.
:::

::

`nested: true` writes an `index.ts` in every subfolder. `namespace: true` also exports each subfolder as a named namespace, such as `PetService`. Kubb reads the plugin's `output.barrel` first, then the root [`output.barrel`](/docs/5.x/reference/configuration#outputbarrel), then `false`. [`@kubb/plugin-barrel` options](/extensions/kubb-labs/plugin-barrel/options) covers `nested` and `namespace` in full.

```typescript [kubb.config.ts]
import { pluginZod } from '@kubb/plugin-zod'

pluginZod({ output: { path: 'zod', barrel: { type: 'all', nested: true } } })
```

### output.banner {#output-banner}

Text at the top of every generated file, such as a license header or a `'use server'` directive. It replaces the [default banner](/docs/5.x/reference/configuration#outputdefaultbanner).

A string goes on every file, barrels included. A function runs once per file and returns the banner, or `''` for none. Its `BannerMeta` holds the document info (`title`, `description`, `version`, `baseURL`, and the rest of `InputMeta`) plus:

| Field | Type | Value |
| --- | --- | --- |
| `filePath` | `string` | The full output path of the file |
| `baseName` | `string` | The file name, such as `pet.ts` |
| `isBarrel` | `boolean` | `true` for an `index.ts` barrel |
| `isAggregation` | `boolean` | `true` for a group `[dir]/[dir].ts` aggregation file |

```typescript [kubb.config.ts]
import { pluginFetch } from '@kubb/plugin-fetch'

pluginFetch({
  output: {
    path: 'clients',
    banner: (meta) => (meta.isBarrel || meta.isAggregation ? '' : "'use server'"),
  },
})
```

Barrels get a banner only when the plugin sets `output.banner`. They never get the default banner.

### output.footer {#output-footer}

Text at the bottom of every generated file. It takes the same values as [`output.banner`](#output-banner).

Pair `banner: '/* eslint-disable */'` with `footer: '/* eslint-enable */'` to scope a lint disable to each file.

## group {#group}

Puts each operation's files in a subfolder, `{output.path}/{groupName}/`, named after its tag or URL path. Without `group`, every file lands in `output.path`. Switch the mode to see where operations land.

::grouping-diagram
::

`group` needs [directory output](#output-mode). Combine tag groups with [`output.barrel.namespace`](#output-barrel) to export each group as a named service.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({ group: { type: 'tag' } }) // src/gen/types/pet/, src/gen/types/store/, ...
```

### group.type {#group-type}

Which value assigns an operation to a group. Required when `group` is set.

::field-group

:::field{name="'tag'"}
The operation's first tag. An operation without tags goes in the `default` group. When an OpenAPI 3.2 tag declares a `parent`, its folder sits inside the parent's folder, such as `animals/cats/`.
:::

:::field{name="'path'"}
The first segment of the URL path, such as `pet` for `/pet/{petId}`.
:::

::

### group.name {#group-name}

Turns the group value into the folder name, which is also the suffix of aggregation files. Default: the tag or path segment in camelCase, so `pet store` becomes `petStore`.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  group: { type: 'tag', name: ({ group }) => `${group}Api` }, // src/gen/types/petApi/
})
```

## include {#include}

Generates only the operations and schemas that match at least one entry.

### How filters match

`include`, [`exclude`](#exclude), and [`override`](#override) entries share one shape. Each entry sets a `type`, and most take a `pattern`:

| `type` | Tests `pattern` against | Applies to |
| --- | --- | --- |
| `tag` | Each of the operation's tags | Operations |
| `operationId` | The `operationId` | Operations |
| `path` | The full URL path, such as `/pet/{petId}` | Operations |
| `method` | The HTTP method, ignoring case | Operations |
| `contentType` | Each request body content type | Operations |
| `schemaName` | The `#/components/schemas` name | Schemas |
| `extension` | No pattern: `key` is an `x-*` key on the operation, and the optional `value` must be strictly equal | Operations |

A string `pattern` is compiled with `new RegExp(pattern)`, so it matches anywhere: `'pet'` also matches `'petType'`. Anchor it as `'^pet$'` for an exact match.

Only `schemaName` entries filter schemas. An `include` without a `schemaName` entry keeps every schema, and an `include` with only `schemaName` entries generates no operations.

```typescript [Type definition]
export type Include =
  | { type: 'tag' | 'operationId' | 'path' | 'contentType' | 'schemaName'; pattern: string | RegExp }
  | { type: 'method'; pattern: HttpMethod | RegExp }
  | { type: 'extension'; key: `x-${string}`; value?: unknown }
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

### Precedence

```mermaid
flowchart LR
  node[Operation or schema] --> ex{Matches an exclude entry?}
  ex -- yes --> skip[Skipped]
  ex -- no --> inc{include set and no entry matches?}
  inc -- yes --> skip
  inc -- no --> ov{An override entry matches?}
  ov -- yes --> merged[Plugin options + first match]:::core
  ov -- no --> base[Plugin options]
```

## exclude {#exclude}

Skips every operation or schema that matches at least one entry. `exclude` wins over `include`.

Entries [match like `include` entries](#how-filters-match). When a client plugin (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, or `@kubb/plugin-client`) excludes an operation, the plugins built on it (`@kubb/plugin-react-query`, `@kubb/plugin-vue-query`, `@kubb/plugin-swr`, `@kubb/plugin-mcp`) skip it too.

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

Gives the operations or schemas that match an entry different plugin options.

```typescript [Type definition]
export type Override = Include & {
  options: Omit<Partial<ResolvedOptions>, 'override'>
}
```

- Entries [match like `include` entries](#how-filters-match) and are checked top to bottom. Only the first match applies, so entries never stack.
- `options` takes any plugin option except `override`. It merges shallowly over the plugin options, so an object option such as `enum` replaces the plugin's value whole: give it every field. An `output` without `mode` reads it from `output.path`.
- When a client plugin overrides `returnType`, `output`, or `group` for an operation, the plugins built on it follow that override.

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  override: [
    {
      type: 'tag',
      pattern: 'admin',
      options: {
        output: { path: 'admin' },
        enum: { type: 'enum', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
      },
    },
  ],
})
```

## resolver {#resolver}

Changes how the plugin names generated files and symbols. Members you leave out keep the plugin's own behavior.

Every resolver has the members below. A plugin adds its own namespaces, such as `param` and `response` on `@kubb/plugin-ts`, listed on its options page. Inside a method, `this` is the full resolver, so `this.default.name(name)` reuses the built-in casing.

```typescript [Shared members]
type ResolverPatch = {
  name?(name: string): string // the identifier for a name
  file?: {
    baseName?(params: { name: string; extname: string }): string // the file name, extension included
    path?(params: { baseName: string; output: Output }): string // the full path, which skips output.path and group
  }
  imports?(options: ResolveImportsOptions): Array<ImportNode> // the imports for the $ref schemas a node uses
}
```

```typescript [kubb.config.ts]
import { pluginTs } from '@kubb/plugin-ts'

pluginTs({
  resolver: {
    name(name) {
      return `${this.default.name(name)}Model` // Pet becomes petModel
    },
  },
})
```

See [Customize resolvers](/docs/5.x/how-to/customize#resolvers) for how a patch layers over the default.

## macros {#macros}

Rewrite AST nodes before the plugin prints them, without forking its generator.

A macro callback such as `schema` or `operation` receives a node and returns a replacement, or `undefined` to keep it. Macros run in order, so each sees the output of the one before. The client plugins (`@kubb/plugin-fetch`, `@kubb/plugin-axios`, `@kubb/plugin-client`) run their built-in macros before yours. `kubb/kit` exports the built-in `macroDedupeUnion`, `macroDiscriminatorEnum`, and `macroEnumName`.

```typescript [kubb.config.ts]
import { defineMacro } from 'kubb/kit'
import { pluginTs } from '@kubb/plugin-ts'

const macroUntagged = defineMacro({
  name: 'untagged',
  operation(node) {
    return node.tags?.length ? undefined : { ...node, tags: ['untagged'] }
  },
})

pluginTs({ macros: [macroUntagged] })
```

See [Customize macros](/docs/5.x/how-to/customize#macros) for a walkthrough and [Macros](/docs/5.x/reference/kit/ast#macros) for the `Macro` type.
