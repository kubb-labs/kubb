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

# @kubb/plugin-barrel

### Barrel-file plugin for Kubb, the meta framework for code generation

Automatically generates `index.ts` re-export files for each plugin output directory and an optional root barrel after all plugins have run.

## Installation

```bash
bun add @kubb/plugin-barrel
# or
pnpm add @kubb/plugin-barrel
# or
npm install @kubb/plugin-barrel
```

## Usage

Add `pluginBarrel` to the `plugins` array in your `kubb.config.ts`:

```typescript
import { defineConfig } from 'kubb'
import { pluginBarrel } from '@kubb/plugin-barrel'

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginBarrel({
      type: 'named',
    }),
  ],
})
```

## Options

| Option | Type                              | Default   | Description                                 |
| ------ | --------------------------------- | --------- | ------------------------------------------- |
| `type` | `'all' \| 'named' \| 'propagate'` | `'named'` | Export style for the generated barrel files |

### Export types

| Value         | Output                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| `'all'`       | `export * from './...'` — wildcard re-exports                                   |
| `'named'`     | `export { ... } from './...'` — named re-exports, tree-shaking friendly         |
| `'propagate'` | `export * from './...'` on index files only, propagating up through directories |

## How it works

After every plugin finishes generating files, `@kubb/plugin-barrel` walks the output tree and creates an `index.ts` in each directory, re-exporting everything inside. It then creates a root `index.ts` at the top of the output path that re-exports from all plugin directories.

`@kubb/plugin-barrel` uses `enforce: 'post'` so it always runs after all regular plugins complete, giving it access to the full set of generated files.

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/@kubb/plugin-barrel
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/@kubb/plugin-barrel
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/plugin-barrel.svg?variant=secondary&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/@kubb/plugin-barrel
