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
<a href="https://kubb.dev/extensions/kubb-labs/parser-ts" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/parser-ts

### TypeScript source file parser for Kubb

Prints Kubb AST nodes as TypeScript source strings. Handles both `.ts` and `.tsx` output. It does not load the TypeScript compiler, so it also runs in edge runtimes such as Cloudflare Workers.

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
  input: './petstore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs(), parserTsx()],
})
```

Pass an `extension` map to rewrite the extensions emitted in `import`/`export` statements. Each key is the extension of a generated file, and its value is the extension written on the relative specifiers in that file. An empty string drops it. Parsers drop the extension by default. Use `{ '.ts': '.js' }` for ESM output compiled to JavaScript, or `{ '.ts': '.ts' }` to run the `.ts` files directly in Node.js or compile them with `rewriteRelativeImportExtensions`:

```typescript
export default defineConfig({
  input: './petstore.yaml',
  output: { path: './src/gen' },
  parsers: [parserTs({ extension: { '.ts': '.js' } }), parserTsx()],
})
```

`print(...fragments)` joins printed code strings with a newline. It still accepts TypeScript compiler nodes, but that form is deprecated and needs `@typescript/typescript6` installed. It is removed in the next major.

## API

### `parserTs(options?)`

Factory returning a parser instance for `.ts` and `.js` files. Pass to `defineConfig({ parsers: [...] })` to emit TypeScript source files. The optional `extension` map rewrites the extensions written in `import`/`export` statements and defaults to `{ '.ts': '' }`.

The returned instance exposes `parse(file)` to serialize a `FileNode` to TypeScript source and `print(...fragments)` to join printed code strings.

### `parserTsx(options?)`

Factory returning a parser instance for `.tsx` and `.jsx` files. Same API and `extension` option as `parserTs`, with JSX support.

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/parser-ts.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/parser-ts
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/parser-ts.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/parser-ts
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/parser-ts.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/parser-ts.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/parser-ts
