---
layout: doc
title: Extensions
description: defineExtension in kubb/kit defines a plugin, an adapter, or a
  parser. Covers meta, compatibility checks, plugin dependencies, factory
  statics, the plugin setup context, and what each kind returns and is named.
outline:
  - 2
  - 3
order: 1
navigation:
  title: Extensions
  icon: i-iconoir-puzzle
---

# Extensions

Plugins, adapters, and parsers are extensions. `defineExtension` from `kubb/kit` takes a definition object and returns a factory. The config calls that factory with the user's options.

## `defineExtension` {#define-extension}

`kind` picks what the definition defines. The other fields follow from it:

|                    | Plugin                                                   | Adapter                                                         | Parser                                                                       |
| ------------------ | -------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `kind`             | `'plugin'`                                               | `'adapter'`                                                     | `'parser'`                                                                   |
| Config field       | `plugins`                                                | `adapter`                                                       | `parsers`                                                                    |
| Definition fields  | `meta`, `setup`, `dependencies`, `enforce`, `hooks`      | `meta`, `setup`, `build`                                        | `meta`, `build`                                                              |
| Receives           | The user's options and the [setup context](#setup-context) | `setup` gets the user's options. `build` gets what `setup` returns. | The user's options, or `{}`                                                  |
| Returns            | The resolved options, from `setup`                       | The document and its methods, from `build`                      | The parser methods, from `build`                                             |
| Runs               | Once per build, after the adapter parses the input. Its generators then walk every node. | First. `parse` turns the input into an `InputNode`. | Last. `parse` prints each file as Kubb writes it. Plugins call `print` while they generate. |
| Deprecated factory | `definePlugin`                                           | `createAdapter`                                                 | `defineParser`                                                               |
| Details            | [Plugins](#plugins)                                      | [Adapters](#adapters)                                           | [Parsers](#parsers)                                                          |

> [!WARNING]
> `definePlugin`, `createAdapter`, and `defineParser` are deprecated. They take the same object without `kind`. Call `defineExtension` and add the `kind` instead.

## `meta` {#meta}

`meta` holds the extension's identity. Kubb reads `name` and `compatibility` at runtime. Studio, the registry, and kubb.dev read the rest.

```typescript [plugin-example.ts]
import { defineExtension } from 'kubb/kit'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: {
    name: 'plugin-example',
    version: '1.0.0',
    displayName: 'Example',
    description: 'Adds a comment to every generated schema.',
    compatibility: { kubb: '>=5.7.0', node: '>=22' },
  },
})
```

| Field           | Type                               | Description                                                                                                       |
| --------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `name`          | `string`                           | Required. Unique name, such as `'plugin-ts'`. The extension takes its `name` from it.                             |
| `version`       | `string`                           | Package version. [Dependents](#dependencies) check their `version` range against it.                              |
| `displayName`   | `string`                           | Human-readable name, such as `'TypeScript'`.                                                                      |
| `description`   | `string`                           | One sentence on what the extension generates or does.                                                             |
| `category`      | `string`                           | Registry category, such as `'types'` or `'client'`.                                                               |
| `icon`          | `{ light: string; dark?: string }` | Icon URLs, with an optional variant for dark backgrounds.                                                         |
| `media`         | `Array<string>`                    | Screenshots or videos, as HTTPS URLs.                                                                             |
| `tags`          | `Array<string>`                    | Search keywords for the registry.                                                                                 |
| `compatibility` | `{ kubb?: string; node?: string }` | Semver ranges for `@kubb/core` and Node.js. See [compatibility checks](#compatibility-checks).                    |
| `docs`          | `string`                           | URL of the extension's docs page.                                                                                 |
| `issues`        | `string`                           | URL of the issue tracker. Kubb prints it as the `report:` link when the extension crashes.                        |

Import `version` from `package.json` and `compatibility` [from `kubb-extension.json`](/docs/5.x/reference/kit/manifest#import-compatibility-into-meta), so each lives in one file. Named JSON imports need a bundler that inlines them, such as tsdown.

### Compatibility checks

Before any plugin runs, Kubb checks the `meta.compatibility` of the adapter, every parser, and every plugin against the running `@kubb/core` and Node.js. A mismatch fails with [`KUBB_INCOMPATIBLE_EXTENSION`](/docs/5.x/reference/diagnostics#kubb-incompatible-extension). Prereleases compare like releases, and a canary build (`0.0.0-canary-*`) skips the `kubb` range.

## `dependencies` {#dependencies}

Plugins only. `dependencies` lists the plugins this one builds on, keyed by `meta.name`. Kubb runs them first. Each entry sets how Kubb checks one:

```typescript [plugin-example.ts]
import { defineExtension } from 'kubb/kit'

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  dependencies: {
    'plugin-ts': { version: '>=5.0.0' },
    'plugin-zod': { optional: true },
  },
})
```

| Entry field | Type      | Description                                                                                                  |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `version`   | `string`  | Semver range the dependency's `meta.version` must satisfy. Kubb skips the check when it has no `meta.version`. |
| `optional`  | `boolean` | When `true`, a missing plugin is skipped. An installed one still has its `version` checked.                   |

Kubb checks the records before any plugin runs:

| Problem                                       | Result                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A required entry is missing from the config   | Fails with [`KUBB_MISSING_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-missing-dependency)                |
| An `optional: true` entry is missing          | Skipped                                                                                                       |
| A `meta.version` is outside the entry's range | Fails with [`KUBB_INCOMPATIBLE_DEPENDENCY`](/docs/5.x/reference/diagnostics#kubb-incompatible-dependency)      |
| The dependencies form a cycle                 | Fails with [`KUBB_INVALID_PLUGIN_OPTIONS`](/docs/5.x/reference/diagnostics#kubb-invalid-plugin-options)        |

To pick dependencies from the user's options, pass a function. It receives the options and `{ config }`, and returns the record:

```typescript [plugin-example.ts]
import { defineExtension, type PluginType } from 'kubb/kit'

type PluginExample = PluginType<'plugin-example', { parser?: 'data' | 'faker' }>

export const pluginExample = defineExtension<PluginExample>({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  dependencies: (options) => ({
    'plugin-ts': {},
    ...(options.parser === 'faker' ? { 'plugin-faker': {} } : {}),
  }),
})
```

> [!NOTE]
> An array, such as `dependencies: ['plugin-ts']`, still works. It only orders plugins: a missing one is skipped, and versions are not checked.

## Factory statics {#factory-statics}

Every factory carries `kind` and `meta`, so tools read them without calling it:

```typescript
pluginExample.kind // 'plugin'
pluginExample.meta.name // 'plugin-example'
```

The extension the factory returns gets `name` (from `meta.name`), `meta`, and the user's raw `options`. A hand-written plugin or parser object with only the deprecated `name` gets `meta: { name }`. One with neither fails with `KUBB_INVALID_PLUGIN_OPTIONS`.

## Plugins {#plugins}

A plugin generates code from the AST. Its `setup` registers [generators](/docs/5.x/reference/kit/generators), a [resolver](/docs/5.x/reference/kit/resolvers), and macros. It returns the resolved options, which generators read as `ctx.options`.

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

`PluginType<TName, TOptions, TResolvedOptions, TResolver>` types the plugin: `TOptions` is what users pass, `TResolvedOptions` what `setup` returns.

| Field          | Type                                                          | Description                                                                                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `setup`        | `(options, kubb: KubbPluginSetupContext) => TResolvedOptions` | Runs once per build, before `kubb:plugin:setup`. Can be `async`.                                                   |
| `dependencies` | [`ExtensionDependencies`](#dependencies)                      | Plugins this one builds on.                                                                                        |
| `enforce`      | `'pre' \| 'post'`                                             | Runs the plugin before (`'pre'`) or after (`'post'`) the others. Dependencies still run first.                     |
| `hooks`        | `{ [hook]: handler }`                                         | Handlers for any [lifecycle hook](/docs/5.x/reference/kit/hooks). The `kubb:plugin:setup` handler runs after `setup`. |

### Setup context {#setup-context}

`setup` and the `kubb:plugin:setup` hook register everything through the setup context. Reach it as the context argument (`kubb` in `setup`, `ctx` in the hook), or through composables from `kubb/kit`, such as `addGenerator()`. Composables take no argument, so helpers that `setup` calls can use them too.

::code-group

```typescript [kubb argument]
import { createResolver, defineExtension, defineGenerator } from 'kubb/kit'

const resolver = createResolver({ pluginName: 'plugin-example' })
const generator = defineGenerator({ name: 'example', operation: () => [] })

export const pluginExample = defineExtension({
  kind: 'plugin',
  meta: { name: 'plugin-example' },
  setup(options, kubb) {
    kubb.requirePlugin('plugin-ts')
    kubb.setResolver(resolver)
    kubb.addGenerator(generator)
    return options
  },
})
```

```typescript [Composables]
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

::

| `kubb` member   | Composable        | Signature                                                 | Purpose                                                                         |
| --------------- | ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `addGenerator`  | `addGenerator()`  | `(...generators: Array<Generator>) => void`               | Registers generators for this plugin.                                           |
| `setResolver`   | `setResolver()`   | `(resolver: ResolverPatch<Resolver> \| Resolver) => void` | Sets the resolver. A patch merges over the built-in defaults.                   |
| `addMacro`      | `addMacro()`      | `(macro: Macro) => void`                                  | Adds a macro that rewrites AST nodes before generators run.                     |
| `setMacros`     | `setMacros()`     | `(macros: ReadonlyArray<Macro>) => void`                  | Replaces this plugin's macros.                                                  |
| `setOptions`    | `setOptions()`    | `(options: ResolvedOptions) => void`                      | Sets the resolved options. In `setup`, return them instead.                     |
| `injectFile`    | `injectFile()`    | `(file: UserFileNode) => void`                            | Adds a file to the output, outside generation. Set `copy` to an absolute path to copy a shipped template. |
| `requirePlugin` | `requirePlugin()` | `(name: string) => Plugin`                                | Returns another plugin, or fails with `KUBB_PLUGIN_NOT_FOUND`.                  |
| `memo`          | `memo()`          | `(key: string, compute: () => T) => T`                    | Returns a value computed once per build and shared by every plugin.             |
| `config`        | `useConfig()`     | `Config`                                                  | The resolved build configuration.                                               |
| `options`       | `useOptions()`    | `TOptions`                                                | The plugin's options as the user passed them.                                   |

`useKubb()` returns the whole context, and `tryUseKubb()` returns `undefined` outside setup instead of throwing. Composables read the context of the plugin whose setup is running, also after an `await`. Outside `setup` and `kubb:plugin:setup`, including in generators, they throw [`KUBB_NO_CONTEXT`](/docs/5.x/reference/diagnostics#kubb-no-context).

`memo(store, key, compute)` caches in a store you own, outside a build: a `Map`, a `WeakMap`, or `memo.create()`. `memo.create({ weak: true })` frees an entry with its key, and `memo.create({ max })` empties the store when it is full.

### Plugin naming {#plugin-naming}

| Surface            | Pattern                                            | Example            |
| ------------------ | -------------------------------------------------- | ------------------ |
| npm package        | `@<scope>/plugin-<name>` or `kubb-plugin-<name>`   | `@kubb/plugin-zod` |
| `meta.name`        | `plugin-<name>`                                    | `'plugin-zod'`     |
| Factory export     | `plugin<Name>`                                     | `pluginZod`        |
| Name constant      | `plugin<Name>Name`                                 | `pluginZodName`    |
| `PluginType` alias | `Plugin<Name>`                                     | `PluginZod`        |

Type the name constant with `satisfies`: `export const pluginZodName = 'plugin-zod' satisfies PluginZod['name']`.

## Adapters {#adapters}

> [!TIP]
> For OpenAPI 2.0, 3.0, 3.1, and 3.2, use the official [`@kubb/adapter-oas`](/extensions/kubb-labs/adapter-oas). `defineConfig` from `kubb/config` sets it when the config has no `adapter`. Write your own only for another spec, such as AsyncAPI, GraphQL, JSON Schema, or gRPC.

An adapter turns the input spec into the [`InputNode`](/docs/5.x/reference/kit/ast#node-tree) every plugin reads. `setup` turns the user's options into resolved options, and `build` returns the adapter for them. This one returns an empty `InputNode`, so fill `schemas` and `operations` from your spec.

```typescript [adapterCustom.ts]
import { ast, defineExtension } from 'kubb/kit'
import type { AdapterFactoryOptions } from 'kubb/kit'

type AdapterCustom = AdapterFactoryOptions<'custom', { strict?: boolean }, { strict: boolean }>

export const adapterCustom = defineExtension<AdapterCustom>({
  kind: 'adapter',
  meta: { name: 'custom' },
  setup: (options) => ({ strict: options.strict ?? false }),
  build: () => ({
    document: null,
    async parse(_source) {
      return ast.factory.createInput({ schemas: [], operations: [] })
    },
    async validate() {
      // Throw here when the spec is invalid.
    },
  }),
})
```

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterCustom } from './adapterCustom.ts'

export default defineConfig({
  input: './my-spec.json',
  output: { path: './src/gen' },
  adapter: adapterCustom({ strict: true }),
  plugins: [],
})
```

`build` returns these members:

| Member     | Type                                                                                                     | Required | Purpose                                                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `document` | `TDocument \| null`                                                                                      | Yes      | The parsed source document. `null` before `parse()`.                                                                                        |
| `parse`    | `(source: AdapterSource, options?: { signal?: AbortSignal; fileRefs?: Array<string> }) => InputNode \| Promise<InputNode>` | Yes      | Converts the spec into the AST. With `fileRefs`, a `$ref` reads local files only inside those folders, and none when the list is empty.     |
| `validate` | `(input: string, options?: { throwOnError?: boolean }) => Promise<void>`                                 | Yes      | Validates the document at a path or URL. [`kubb validate`](/docs/5.x/reference/commands/validate) passes `throwOnError: true`, so throw on invalid input. |
| `settle`   | `() => Promise<void>`                                                                                    | No       | Waits for work `parse` left running, such as validation in a worker. Kubb awaits it before `kubb:build:end`. Must not reject.                |
| `locate`   | `(source: string, location: DiagnosticLocation) => { start: number; end: number } \| undefined`          | No       | Places a diagnostic in the source text for a CLI code frame: zero-based UTF-16 offsets, `end` exclusive.                                    |
| `sources`  | `Array<string>`                                                                                          | No       | The files and URLs the last `parse()` read, even unreadable ones. A watcher rebuilds when one changes.                                     |

`AdapterSource` is `{ type: 'path'; path }` or `{ type: 'data'; data; root? }`, where `root` is the folder relative `$ref`s resolve from.

> [!IMPORTANT]
> When the input is invalid, throw from `parse()` with a clear message.

An adapter that renames a schema, such as to break a name collision, sets `targetName` on every ref node that points at it. [`resolver.imports`](/docs/5.x/reference/kit/resolvers#imports) and `ast.ref.getName` then use the new name.

### Adapter naming {#adapter-naming}

| Surface                       | Pattern                                            | Example             |
| ----------------------------- | -------------------------------------------------- | ------------------- |
| npm package                   | `@<scope>/adapter-<name>` or `kubb-adapter-<name>` | `@kubb/adapter-oas` |
| `meta.name`                   | The spec identifier, in lowercase                  | `'oas'`             |
| Factory export                | `adapter<Name>`                                    | `adapterOas`        |
| Name constant                 | `adapter<Name>Name`                                | `adapterOasName`    |
| `AdapterFactoryOptions` alias | `Adapter<Name>`                                    | `AdapterOas`        |

## Parsers {#parsers}

> [!TIP]
> For TypeScript and JavaScript output, use [`@kubb/parser-ts`](/extensions/kubb-labs/parser-ts). When the config sets no `parsers`, `defineConfig` adds `parserTs()`, `parserTsx()`, and `parserMd()`. Write your own only for another language, such as Python, Kotlin, or Rust.

A parser turns a `FileNode` into the source text Kubb writes. `build` gets the user's options and returns the parser methods:

```typescript [parserText.ts]
import { defineExtension } from 'kubb/kit'

export const parserText = defineExtension({
  kind: 'parser',
  meta: { name: 'text', version: '1.0.0' },
  build() {
    return {
      extNames: ['.txt'],
      parse(file) {
        return file.sources
          .flatMap((source) => source.nodes ?? [])
          .map((node) => (node.kind === 'Text' ? node.value : ''))
          .join('\n')
      },
      print(...nodes) {
        return nodes.map(String).join('\n')
      },
    }
  },
})
```

A `parsers` array replaces the defaults, so list them again to keep TypeScript and Markdown output:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { parserMd } from '@kubb/parser-md'
import { parserTs, parserTsx } from '@kubb/parser-ts'
import { parserText } from './parserText.ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs(), parserTsx(), parserMd(), parserText()],
})
```

`build` returns these members:

| Member     | Type                                               | Required | Called                              | Purpose                                                                                                                                         |
| ---------- | -------------------------------------------------- | -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `extNames` | `Array<FileNode['extname']> \| undefined`          | Yes      |                                     | The file extensions this parser handles. With `undefined`, `parse` never runs.                                                                |
| `parse`    | `(file: FileNode) => string`                       | Yes      | After every plugin, once per file   | Prints the file's sources. Must be synchronous.                                                                                                 |
| `print`    | `(...nodes: TNode[]) => string`                    | Yes      | By plugins, while they generate     | Prints compiler AST nodes, such as `ts.Node` for `parserTs`.                                                                                    |
| `inline`   | `InlineLanguage`                                   | No       | Before barrels, for inline sources  | Finds names (`replaceIdentifiers`) and makes a definition safe to put where a name was (`wrap`), so files of this parser can absorb inline sources. `parserTs` has it. |
| `copy`     | `(file: FileNode, source: string) => UserFileNode` | No       | For each `copy` file                | Describes a copied template as nodes, such as its imports as `ImportNode`s, for `parse` to print. Without it, Kubb copies the file as is.        |

> [!IMPORTANT]
> When two parsers register the same extension, the last one in the `parsers` array wins.

When no parser handles a file's extension, Kubb writes its sources joined together.

### Parser naming {#parser-naming}

| Surface        | Pattern                                          | Example                      |
| -------------- | ------------------------------------------------ | ---------------------------- |
| npm package    | `@<scope>/parser-<name>` or `kubb-parser-<name>` | `@kubb/parser-ts`            |
| `meta.name`    | The output language or format, in lowercase      | `'typescript'`, `'markdown'` |
| Factory export | `parser<Name>`                                   | `parserTs`, `parserMd`       |
