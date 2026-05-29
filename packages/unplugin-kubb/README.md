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

# unplugin-kubb

### Universal build integration for Kubb

Runs OpenAPI code generation as part of your build pipeline in Vite, Webpack, Rollup, esbuild, Rspack, Nuxt, and Astro, powered by [unplugin](https://github.com/unjs/unplugin).

## Installation

```bash
bun add -D unplugin-kubb @kubb/core
# or
pnpm add -D unplugin-kubb @kubb/core
# or
npm install -D unplugin-kubb @kubb/core
```

```typescript
import kubb from 'unplugin-kubb/vite'

export default defineConfig({
  plugins: [
    kubb({
      /* options */
    }),
  ],
})
```

```typescript
import kubb from 'unplugin-kubb/rollup'

export default {
  plugins: [
    kubb({
      /* options */
    }),
  ],
}
```

```typescript
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-kubb/webpack')({
      /* options */
    }),
  ],
}
```

```typescript
export default defineNuxtConfig({
  modules: [
    [
      'unplugin-kubb/nuxt',
      {
        /* options */
      },
    ],
  ],
})
```

```typescript
import { build } from 'esbuild'
import kubb from 'unplugin-kubb/esbuild'

build({
  plugins: [kubb()],
})
```

## Options

### config

Define the options for Kubb.

```typescript [Options]
type Options = {
  config: UserConfig
}
```

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

[npm-version-src]: https://img.shields.io/npm/v/unplugin-kubb?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/unplugin-kubb
[npm-downloads-src]: https://img.shields.io/npm/dm/unplugin-kubb?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/unplugin-kubb
[license-src]: https://img.shields.io/github/license/kubb-labs/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-labs/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/unplugin-kubb
[minified-src]: https://img.shields.io/bundlephobia/min/unplugin-kubb?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/unplugin-kubb
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-labs/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/unplugin-kubb
[sponsors-src]: https://img.shields.io/github/sponsors/stijnvanhulle?style=flat&colorA=18181B&colorB=f58517
[sponsors-href]: https://github.com/sponsors/stijnvanhulle/
