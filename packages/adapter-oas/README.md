<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

<a href="https://npmjs.com/package/@kubb/adapter-oas" target="_blank">
  <img alt="@kubb/adapter-oas badges" src="https://shieldcn.dev/group/npm/v/@kubb/adapter-oas+npm/dm/@kubb/adapter-oas+github/stars/kubb-labs/kubb+npm/l/@kubb/adapter-oas+badge/sponsors-stijnvanhulle-EA4AAA.svg?variant=branded&size=xs&theme=zinc&mode=dark">
</a>

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
