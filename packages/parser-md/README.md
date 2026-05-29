<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]
[![Sponsors][sponsors-src]][sponsors-href]

<h4>
<a href="https://kubb.dev" target="_blank">Documentation</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
<span> · </span>
<a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
</h4>
</div>

<br />

# @kubb/parser-md

### Markdown source file parser for Kubb

Joins source blocks as plain markdown and renders YAML frontmatter via `parserMd.print`.

## Installation

```bash
bun add @kubb/parser-md
# or
pnpm add @kubb/parser-md
# or
npm install @kubb/parser-md
```

## Usage

```typescript
import { defineConfig } from 'kubb'
import { parserMd } from '@kubb/parser-md'
import { parserTs } from '@kubb/parser-ts'

export default defineConfig({
  input: { path: './petstore.yaml' },
  output: { path: './src/gen' },
  parsers: [parserTs, parserMd],
})
```

To convert a metadata object into a YAML frontmatter envelope from inside a plugin, call `print` on the parser instance:

```typescript
import { parserMd } from '@kubb/parser-md'

const source = parserMd.print({ title: 'Pets', layout: 'doc' })
// → ---
//   title: Pets
//   layout: doc
//   ---
```

## API

### `parserMd`

Parser instance for `.md` and `.markdown` files. Pass to `defineConfig({ parsers: [...] })` to emit Markdown source files.

- `parserMd.parse(file)` — serialise a `FileNode` to Markdown source. When `file.meta.frontmatter` is set, the parser prepends the corresponding YAML envelope.
- `parserMd.print(...parts)` — join markdown fragments separated by blank lines. Plain objects are serialised as YAML frontmatter; strings pass through unchanged.

## Supporting Kubb

Kubb is an open source project, and its development is funded entirely by sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/parser-md?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/parser-md
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/parser-md?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/parser-md
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/parser-md
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
