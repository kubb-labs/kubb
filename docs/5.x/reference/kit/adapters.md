---
layout: doc
title: Adapters - Turn a spec into the Kubb AST
description: Build a Kubb adapter with defineExtension and kind adapter. It converts an input spec into the universal AST. Covers the Adapter interface.
outline:
  - 2
  - 3
order: 5
navigation:
  title: Adapters
  icon: i-iconoir-link
---

# Adapters

> [!TIP]
> For OpenAPI 2.0, 3.0, 3.1, and 3.2, use the official [`@kubb/adapter-oas`](/extensions/kubb-labs/adapter-oas). `defineConfig` from `kubb/config` sets it when the config has no `adapter`. Write your own only for another spec, such as AsyncAPI, GraphQL, JSON Schema, or gRPC.

An adapter turns the input spec into the [`InputNode`](/docs/5.x/reference/kit/ast#node-tree) every plugin reads. `setup` turns the user's options into resolved options, and `build` returns the adapter for them. This one returns an empty `InputNode`, so fill `schemas` and `operations` from your spec. Define one with [`defineExtension`](/docs/5.x/reference/kit/extensions#define-extension) and `kind: 'adapter'`. [`meta`](/docs/5.x/reference/kit/extensions#meta) and the [factory statics](/docs/5.x/reference/kit/extensions#factory-statics) work the same for every extension.

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
| `parse`    | `(source: AdapterSource, options?: { signal?: AbortSignal; fileRefs?: Array<string> }) => InputNode \| Promise<InputNode>` | Yes      | Converts the spec into the AST. Kubb passes `fileRefs` through and checks no reads: the adapter must read local `$ref` files only inside those folders, and none when the list is empty. |
| `validate` | `(input: string, options?: { throwOnError?: boolean }) => Promise<void>`                                 | Yes      | Validates the document at a path or URL. [`kubb validate`](/docs/5.x/reference/commands/validate) passes `throwOnError: true`, so throw on invalid input. |
| `settle`   | `() => Promise<void>`                                                                                    | No       | Waits for work `parse` left running, such as validation in a worker. Kubb awaits it before `kubb:build:end`. Must not reject.                |
| `locate`   | `(source: string, location: DiagnosticLocation) => { start: number; end: number } \| undefined`          | No       | Places a diagnostic in the source text for a CLI code frame: zero-based UTF-16 offsets, `end` exclusive.                                    |
| `sources`  | `Array<string>`                                                                                          | No       | The files and URLs the last `parse()` read, even unreadable ones. A watcher rebuilds when one changes.                                     |

`AdapterSource` is `{ type: 'path'; path }` or `{ type: 'data'; data; root? }`, where `root` is the folder relative `$ref`s resolve from.

> [!IMPORTANT]
> When the input is invalid, throw from `parse()` with a clear message.

An adapter that renames a schema, such as to break a name collision, sets `targetName` on every ref node that points at it. [`resolver.imports`](/docs/5.x/reference/kit/resolvers#imports) and `ast.ref.getName` then use the new name.

## Adapter naming {#adapter-naming}

| Surface                       | Pattern                                            | Example             |
| ----------------------------- | -------------------------------------------------- | ------------------- |
| npm package                   | `@<scope>/adapter-<name>` or `kubb-adapter-<name>` | `@kubb/adapter-oas` |
| `meta.name`                   | The spec identifier, in lowercase                  | `'oas'`             |
| Factory export                | `adapter<Name>`                                    | `adapterOas`        |
| Name constant                 | `adapter<Name>Name`                                | `adapterOasName`    |
| `AdapterFactoryOptions` alias | `Adapter<Name>`                                    | `AdapterOas`        |
