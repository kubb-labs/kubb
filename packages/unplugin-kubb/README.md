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

[npm-version-src]: https://shieldcn.dev/npm/v/unplugin-kubb.svg?variant=branded&size=xs&theme=zinc&mode=dark
[npm-version-href]: https://npmx.dev/package/unplugin-kubb
[npm-downloads-src]: https://shieldcn.dev/npm/dm/unplugin-kubb.svg?variant=branded&size=xs&theme=zinc&mode=dark
[npm-downloads-href]: https://npmx.dev/package/unplugin-kubb
[stars-src]: https://shieldcn.dev/github/stars/kubb-labs/kubb.svg?variant=branded&size=xs&theme=zinc&mode=dark
[stars-href]: https://github.com/kubb-labs/kubb
[license-src]: https://shieldcn.dev/npm/license/unplugin-kubb.svg?variant=branded&size=xs&theme=zinc&mode=dark
[license-href]: https://github.com/kubb-labs/kubb/blob/main/LICENSE
[node-src]: https://shieldcn.dev/npm/node/unplugin-kubb.svg?variant=branded&size=xs&theme=zinc&mode=dark
[node-href]: https://npmx.dev/package/unplugin-kubb
