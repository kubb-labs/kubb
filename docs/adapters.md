---
layout: doc

title: Kubb Adapters - OpenAPI Specification Parsers
description: Explore Kubb adapters for parsing OpenAPI specifications. Adapters convert your API spec into Kubb's internal AST for downstream plugins.
outline: deep
---

# Adapters

Kubb uses an adapter to read and convert your OpenAPI specification into its internal AST (Abstract Syntax Tree). All plugins consume this AST to generate their output.

An adapter is configured once in `defineConfig` using the `adapter` key.

## [@kubb/adapter-oas](/adapters/adapter-oas)

The built-in OpenAPI adapter. Supports OpenAPI 2.0 (Swagger), 3.0, and 3.1.

Controls how dates, integers, empty schemas, enums, and discriminators are represented in the AST. These settings affect all downstream plugins.

```typescript
import { adapterOas } from '@kubb/adapter-oas'

adapterOas({
  validate: true,
  dateType: 'date',
  serverIndex: 0,
})
```

## Usage

The adapter is set at the top level of your `kubb.config.ts`:

```typescript twoslash
import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: {
    path: './petstore.yaml',
  },
  output: {
    path: './src/gen',
  },
  adapter: adapterOas({
    validate: true,
    dateType: 'date',
    unknownType: 'unknown',
  }),
  plugins: [pluginTs()],
})
```

## Adapter Architecture

All Kubb adapters follow a consistent interface:

- **Parse**: Read and validate the input spec
- **AST**: Convert the spec into Kubb's internal node tree
- **Resolve**: Provide name resolution and import tracking for plugins

For detailed configuration options and usage examples, visit each adapter's documentation page.
