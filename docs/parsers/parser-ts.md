---
layout: doc

title: '@kubb/parser-ts - TypeScript & TSX File Parser'
description: Parse and convert TypeScript and TSX generated files to strings using the TypeScript compiler. Includes utilities for creating imports, exports, and AST nodes.
outline: deep
---

# @kubb/parser-ts

The `@kubb/parser-ts` package provides parsers that convert Kubb-generated files to strings using the TypeScript compiler. It handles `.ts`, `.js`, `.tsx`, and `.jsx` file extensions and exposes low-level utilities for working with TypeScript AST nodes.

Parsers are configured in `kubb.config.ts` via the [`parsers`](/getting-started/configure#parsers) option.

## Installation

::: code-group

```shell [bun]
bun add @kubb/parser-ts
```

```shell [pnpm]
pnpm add @kubb/parser-ts
```

```shell [npm]
npm install @kubb/parser-ts
```

```shell [yarn]
yarn add @kubb/parser-ts
```

:::

## Usage

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { typescriptParser, tsxParser } from '@kubb/parser-ts'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  parsers: [typescriptParser, tsxParser],
  plugins: [],
})
```

## Parsers

### typescriptParser

Handles `.ts` and `.js` files. Converts a generated file's imports, exports, and source fragments into a single string using the TypeScript compiler printer.

```typescript
import { typescriptParser } from '@kubb/parser-ts'
```

**Handled extensions:** `.ts`, `.js`

### tsxParser

Handles `.tsx` and `.jsx` files. Delegates to `typescriptParser` — the TypeScript compiler natively supports JSX via `ScriptKind.TSX`.

```typescript
import { tsxParser } from '@kubb/parser-ts'
```

**Handled extensions:** `.tsx`, `.jsx`

## Utilities

### print

Converts TypeScript AST nodes to a string using `ts.createPrinter`.

```typescript
import { print } from '@kubb/parser-ts'
import ts from 'typescript'

const { factory } = ts
const node = factory.createIdentifier('hello')
const output = print(node) // → "hello"
```

### safePrint

Like `print`, but validates all nodes first and throws an informative error if any node has `SyntaxKind.Unknown`.

```typescript
import { safePrint } from '@kubb/parser-ts'
```

### validateNodes

Validates TypeScript AST nodes before printing. Throws if any node is `null`, `undefined`, or has `SyntaxKind.Unknown`.

```typescript
import { validateNodes } from '@kubb/parser-ts'

validateNodes(...nodes) // throws on invalid nodes
```

### createImport

Creates a `ts.ImportDeclaration` node from a structured descriptor.

```typescript
import { createImport } from '@kubb/parser-ts'

// import type { User } from './models'
createImport({ name: ['User'], path: './models', isTypeOnly: true })

// import * as React from 'react'
createImport({ name: 'React', path: 'react', isNameSpace: true })
```

### createExport

Creates a `ts.ExportDeclaration` node from a structured descriptor.

```typescript
import { createExport } from '@kubb/parser-ts'

// export { User } from './models'
createExport({ name: ['User'], path: './models' })

// export * as Models from './models'
createExport({ name: 'Models', path: './models', asAlias: true })
```

## Custom Parsers

Use `defineParser` from `@kubb/core` to create a parser for any file extension:

```typescript
import { defineParser, defineConfig } from '@kubb/core'

const jsonParser = defineParser({
  name: 'json',
  extNames: ['.json'],
  parse(file) {
    return file.sources
      .map((s) => s.value)
      .filter(Boolean)
      .join('\n')
  },
})

export default defineConfig({
  input: { path: './petStore.yaml' },
  output: { path: './src/gen' },
  parsers: [jsonParser],
  plugins: [],
})
```

## defineParser

`defineParser` is exported from `@kubb/core` and is the factory function for creating custom parsers.

```typescript
import { defineParser } from '@kubb/core'
import type { Parser } from '@kubb/core'

const myParser: Parser = defineParser({
  name: 'my-parser',
  // extensions this parser handles; undefined = catch-all
  extNames: ['.ts'],
  parse(file, options) {
    // file.sources  — array of { value, name, isExportable, ... }
    // file.imports  — import descriptors
    // file.exports  — export descriptors
    // file.banner   — optional banner string
    // file.footer   — optional footer string
    return file.sources.map((s) => s.value ?? '').join('\n')
  },
})
```
