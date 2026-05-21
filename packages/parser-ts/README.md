<div align="center">
  <h1>@kubb/parser-ts</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://kubb.dev/" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

TypeScript and TSX source file parser for Kubb. Converts AST nodes and raw TypeScript code into formatted source strings using the TypeScript compiler API.

## Installation

```bash
bun add @kubb/parser-ts
# or
pnpm add @kubb/parser-ts
# or
npm install @kubb/parser-ts
```

## Usage

```typescript
import { defineConfig } from 'kubb'
import { parserTs, parserTsx } from '@kubb/parser-ts'

export default defineConfig({
  input: { path: './petstore.yaml' },
  output: { path: './src/gen' },
  parsers: [parserTs, parserTsx],
})
```

To render compiler AST nodes to source text from inside a plugin, call `print` on the parser instance:

```typescript
import { parserTs } from '@kubb/parser-ts'
import ts from 'typescript'

const source = parserTs.print(
  ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration('hello', undefined, undefined, ts.factory.createStringLiteral('world'))],
      ts.NodeFlags.Const,
    ),
  ),
)
// → export const hello = 'world'
```

## API

### `parserTs`

Parser instance for `.ts` and `.js` files. Pass to `defineConfig({ parsers: [...] })` to emit TypeScript source files.

- `parserTs.parse(file, options?)` — serialise a `FileNode` to TypeScript source.
- `parserTs.print(...nodes)` — convert TypeScript compiler `Node` instances to a formatted source string.

### `parserTsx`

Parser instance for `.tsx` and `.jsx` files. Same API as `parserTs` with JSX support.

## Supporting Kubb

Kubb is an open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/parser-ts?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/parser-ts
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/parser-ts?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/parser-ts
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/parser-ts
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
