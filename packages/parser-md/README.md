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
- [See sponsorship tiers and our sponsors](https://kubb.dev/sponsors)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

## License

[MIT](https://github.com/kubb-labs/kubb/blob/main/licenses/LICENSE-MIT)

<!-- Badges -->

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/parser-md.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/parser-md
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/parser-md.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/parser-md
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/parser-md.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/parser-md.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/parser-md
