<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Stars][stars-src]][stars-href]
[![License][license-src]][license-href]
[![Node][node-src]][node-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/parser-ts

### TypeScript source file parser for Kubb

Converts AST nodes and raw TypeScript code into formatted source strings using the TypeScript compiler API. Handles both `.ts` and `.tsx` output.

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

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/parser-ts.svg?variant=branded&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/parser-ts
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/parser-ts.svg?variant=branded&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/parser-ts
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=branded&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/parser-ts.svg?variant=branded&size=xs&theme=zinc&mode=dark
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/parser-ts.svg?variant=branded&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/parser-ts
