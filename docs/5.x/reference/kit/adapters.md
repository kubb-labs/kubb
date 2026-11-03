---
layout: doc
title: Adapters
description: defineExtension with kind adapter builds an adapter that converts
  an input specification into the universal AST. Covers the Adapter interface,
  the built-in OpenAPI adapter, and writing your own.
outline:
  - 2
  - 3
order: 5
navigation:
  title: Adapters
  icon: i-iconoir-link
---

# Adapters

An adapter converts an input specification into the shared AST.

> [!TIP]
> For OpenAPI 2.0, 3.0, and 3.1 use the official [`@kubb/adapter-oas`](/extensions/kubb-labs/adapter-oas). Kubb picks it for you when you import `defineConfig` from the `kubb` package. Write a custom adapter only when you target a different specification such as AsyncAPI, GraphQL, JSON Schema, or gRPC.

## `defineExtension`

`defineExtension` with `kind: 'adapter'` takes a definition object and returns a factory that types the adapter's options. `setup` turns the user's options into the resolved options, and `build` returns the adapter's `document`, `parse`, and `validate` for them. Without `setup`, the user's options are the resolved options.

A minimal adapter declares a name and returns an empty [`InputNode`](/docs/5.x/explanation/architecture#ast). An empty AST emits nothing, so fill `schemas` and `operations` from your spec next.

```typescript [adapterCustom.ts]
import { ast, defineExtension } from 'kubb/kit'
import type { AdapterFactoryOptions } from 'kubb/kit'

type AdapterCustom = AdapterFactoryOptions<'adapter-custom', { strict?: boolean }, { strict: boolean }>

export const adapterCustom = defineExtension<AdapterCustom>({
  kind: 'adapter',
  meta: { name: 'adapter-custom' },
  setup: (options) => ({ strict: options.strict ?? false }),
  build: () => ({
    document: null,
    async parse(_source) {
      return ast.factory.createInput({ schemas: [], operations: [] })
    },
    async validate() {
      // Throw or call ctx.error here when the spec is invalid.
    },
  }),
})
```

### `createAdapter` (deprecated)

> [!WARNING]
> `createAdapter` is deprecated. Use `defineExtension` with `kind: 'adapter'` instead.

`createAdapter` takes the same definition object as `defineExtension`, without `kind`. To move over, rename the call and add `kind: 'adapter'`. See [Extensions](./extensions#define-extension).

Pass the adapter to your config:

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

## Adapter anatomy

Every adapter the factory returns matches the `Adapter` interface from [`kubb/kit`](/docs/5.x/reference/kit):

| Property   | Type                                                                     | Required | Purpose                                                                                       |
| ---------- | ------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| `name`     | `string`                                                                 | Yes      | Unique adapter identifier, filled from `meta.name`. Convention is `adapter-<id>`.             |
| `options`  | `TResolvedOptions`                                                       | Yes      | Adapter options after defaults are applied.                                                   |
| `document` | `TDocument \| null`                                                      | Yes      | The raw parsed source document, for plugins that need direct access. `null` before `parse()`. |
| `parse`    | `(source: AdapterSource) => InputNode \| Promise<InputNode>`             | Yes      | Convert the spec into the [universal AST](/docs/5.x/explanation/architecture#ast).            |
| `validate` | `(input: string, options?: { throwOnError?: boolean }) => Promise<void>` | Yes      | Validate the document at a path or URL without running the full pipeline.                     |
| `locate` | `(source: string, location: DiagnosticLocation) => { start: number; end: number } \| undefined` | No | Where a diagnostic sits in the source text, for CLI code frames. |
| `sources` | `Array<string>` | No | The files and URLs the last `parse()` read, such as the files external `$ref`s point at, including any that could not be read. A watcher rebuilds when one of them changes. |

`locate` receives the local input's source text and a `DiagnosticLocation`, and returns zero-based UTF-16 offsets with an exclusive `end`, or `undefined` when it cannot place that location. Kubb formats the line, column, and frame from that range. The OpenAPI adapter resolves JSON pointers in YAML and JSON. Adapters without `locate` still show diagnostic messages and locations without code frames.

[`kubb validate`](/docs/5.x/reference/commands/validate) calls the configured adapter's `validate` method with `throwOnError: true`. Validation errors must throw to fail the command.

Cross-references need no adapter hook: every plugin resolves `$ref` imports through [`resolver.imports`](/docs/5.x/reference/kit/resolvers#imports), which defaults each ref to its pointer's last segment. An adapter that renames a schema (for example to break a name collision) stamps `targetName` on every ref node pointing at it, so those imports pick up the emitted name. Refs that keep their segment name need no stamp.

> [!IMPORTANT]
> Throw from `parse()` with a clear, user-facing message when the input is invalid.

## Adapter naming convention

Name adapters like plugins, so [`getResolver`](./generators#definegenerator), the registry, and the docs can find them:

| Surface                       | Pattern                                            | Example             |
| ----------------------------- | -------------------------------------------------- | ------------------- |
| npm package                   | `@<scope>/adapter-<name>` or `kubb-adapter-<name>` | `@kubb/adapter-oas` |
| Adapter runtime name          | The spec identifier (lowercase)                    | `'oas'`             |
| Factory export                | `adapter<Name>` (camelCase)                        | `adapterOas`        |
| Name constant                 | `adapter<Name>Name`                                | `adapterOasName`    |
| `AdapterFactoryOptions` alias | `Adapter<Name>` (PascalCase)                       | `AdapterOas`        |

Export a `satisfies`-typed name constant so consumers can reuse the runtime name.
