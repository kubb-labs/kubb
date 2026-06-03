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

# @kubb/adapter-oas

### OpenAPI and Swagger adapter for Kubb

Parses and validates Swagger 2.0, OpenAPI 3.0, and OpenAPI 3.1 specifications and transforms them into a `@kubb/ast` `RootNode` for downstream code generation plugins.

## Installation

```bash
bun add @kubb/adapter-oas
# or
pnpm add @kubb/adapter-oas
# or
npm install @kubb/adapter-oas
```

## Usage

Use `adapterOas` inside your `kubb.config.ts`:

```typescript
import { defineConfig } from 'kubb'
import { adapterOas } from '@kubb/adapter-oas'

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
  },
  adapters: [adapterOas()],
})
```

## API

### `adapterOas(options?)`

Creates the OAS adapter instance. Pass it in the `adapters` array of `defineConfig`.

### `mergeDocuments(documents)`

Merges multiple OpenAPI documents into a single document before parsing.

### Types

All OpenAPI types (`Document`, `Operation`, `SchemaObject`, `HttpMethod`, etc.) are re-exported from this package.

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

[npm-version-src]: https://shieldcn.dev/npm/v/@kubb/adapter-oas.svg?variant=branded&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmjs.com/package/@kubb/adapter-oas
[npm-downloads-src]: https://shieldcn.dev/npm/dm/@kubb/adapter-oas.svg?variant=branded&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmjs.com/package/@kubb/adapter-oas
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=branded&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/@kubb/adapter-oas.svg?variant=ghost&size=xs&theme=zinc&mode=dark
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/@kubb/adapter-oas.svg?variant=outline&size=xs&theme=zinc&mode=dark
[node-href]: https://npmjs.com/package/@kubb/adapter-oas
