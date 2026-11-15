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

An adapter turns the input spec into the [`InputNode`](/docs/5.x/reference/kit/ast#node-tree) every plugin reads. Define one with [`defineExtension`](/docs/5.x/reference/kit/extensions#define-extension) and `kind: 'adapter'`. `setup` resolves the user's options, and `build` returns the adapter for them. [`meta`](/docs/5.x/reference/kit/extensions#meta) and the [factory statics](/docs/5.x/reference/kit/extensions#factory-statics) work as for every extension.

> [!TIP]
> For OpenAPI 2.0, 3.0, 3.1, and 3.2, use the official [`@kubb/adapter-oas`](/extensions/kubb-labs/adapter-oas). `defineConfig` from `kubb/config` sets it when the config has no `adapter`. Write your own only for another spec, such as AsyncAPI, GraphQL, JSON Schema, or gRPC.

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
      // Fill schemas and operations from your spec.
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
| `parse`    | `(source: AdapterSource, options?: { signal?: AbortSignal; fileRefs?: Array<string> }) => InputNode \| Promise<InputNode>` | Yes      | Converts the spec into the AST. `fileRefs` sets which folders a `$ref` may read local files from: unset allows any file, an empty list allows none, and a list allows only those folders. Kubb passes the list through, and the adapter enforces it. |
| `validate` | `(input: string, options?: { throwOnError?: boolean }) => Promise<void>`                                 | Yes      | Validates the document at a path or URL. [`kubb validate`](/docs/5.x/reference/commands/validate) passes `throwOnError: true`, so throw on invalid input. |
| `settle`   | `() => Promise<void>`                                                                                    | No       | Waits for work `parse` left running, such as validation in a worker. Kubb awaits it before `kubb:build:end`. Must not reject.              |
| `locate`   | `(source: string, location: DiagnosticLocation) => { start: number; end: number } \| undefined`          | No       | Finds a diagnostic in the source text for a CLI code frame, as zero-based UTF-16 offsets with `end` exclusive.                             |
| `sources`  | `Array<string>`                                                                                          | No       | The files and URLs the last `parse()` read, for a tool that watches them. `kubb generate --watch` watches only `input`.                 |

`AdapterSource` is `{ type: 'path'; path }` or `{ type: 'data'; data; root? }`, where `root` is the folder relative `$ref`s resolve from.

> [!IMPORTANT]
> When the input is invalid, throw from `parse()` with a clear message.

See [Name collisions](/docs/5.x/topics/name-collisions#name-collisions) for an adapter that renames schemas.

## Adapter naming {#adapter-naming}

| Surface                       | Pattern                                            | Example             |
| ----------------------------- | -------------------------------------------------- | ------------------- |
| npm package                   | `@<scope>/adapter-<name>` or `kubb-adapter-<name>` | `@kubb/adapter-oas` |
| `meta.name`                   | The spec identifier, in lowercase                  | `'oas'`             |
| Factory export                | `adapter<Name>`                                    | `adapterOas`        |
| Name constant                 | `adapter<Name>Name`                                | `adapterOasName`    |
| `AdapterFactoryOptions` alias | `Adapter<Name>`                                    | `AdapterOas`        |
