<div align="center">
  <h1>@kubb/middleware-barrel</h1>
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

Barrel-file middleware for Kubb. Automatically generates `index.ts` re-export files for each plugin output directory and an optional root barrel after all plugins have run.

## Installation

```bash
bun add @kubb/middleware-barrel
# or
pnpm add @kubb/middleware-barrel
# or
npm install @kubb/middleware-barrel
```

## Usage

Add `middlewareBarrel` to the `middleware` array in your `kubb.config.ts`:

```typescript
import { defineConfig } from 'kubb'
import { middlewareBarrel } from '@kubb/middleware-barrel'

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
  },
  middleware: [
    middlewareBarrel({
      type: 'named',
    }),
  ],
})
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `type` | `'all' \| 'named' \| 'propagate'` | `'named'` | Export style for the generated barrel files |

### Export types

| Value | Output |
| ----- | ------ |
| `'all'` | `export * from './...'` — wildcard re-exports |
| `'named'` | `export { ... } from './...'` — named re-exports, tree-shaking friendly |
| `'propagate'` | `export * from './...'` on index files only, propagating up through directories |

## How it works

After every plugin finishes generating files, `@kubb/middleware-barrel` walks the output tree and creates an `index.ts` in each directory, re-exporting everything inside. It then creates a root `index.ts` at the top of the output path that re-exports from all plugin directories.

## Supporting Kubb

Kubb is an open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/middleware-barrel?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/middleware-barrel
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/middleware-barrel?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/middleware-barrel
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/middleware-barrel
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
