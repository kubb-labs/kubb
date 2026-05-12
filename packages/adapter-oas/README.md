<div align="center">
  <h1>@kubb/adapter-oas</h1>
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

OpenAPI and Swagger adapter for Kubb. Parses and validates Swagger 2.0, OpenAPI 3.0, and OpenAPI 3.1 specifications and transforms them into a `@kubb/ast` `RootNode` for downstream code generation plugins.

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

## Features

- Supports Swagger 2.0, OpenAPI 3.0, and OpenAPI 3.1
- Validates and dereferences `$ref` pointers
- Merges multi-document specs
- Outputs a `@kubb/ast` `RootNode` that every Kubb plugin reads from
- Re-exports typed helpers for operations, schemas, parameters, and responses

## API

### `adapterOas(options?)`

Creates the OAS adapter instance. Pass it in the `adapters` array of `defineConfig`.

### `mergeDocuments(documents)`

Merges multiple OpenAPI documents into a single document before parsing.

### Types

All OpenAPI types (`Document`, `Operation`, `SchemaObject`, `HttpMethod`, etc.) are re-exported from this package.

## Supporting Kubb

Kubb is an open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@kubb/adapter-oas?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/@kubb/adapter-oas
[npm-downloads-src]: https://img.shields.io/npm/dm/@kubb/adapter-oas?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/@kubb/adapter-oas
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/@kubb/adapter-oas
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
