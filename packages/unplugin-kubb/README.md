<div align="center">

<!-- <img src="assets/logo.png" alt="logo" width="200" height="auto" /> -->
<h1>unplugin-kubb</h1>

<p>
   Kubb plugin for Vite, webpack, esbuild, Rollup, Nuxt, Astro and Rspack.
  </p>
  <img src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/banner.png" alt="logo"  height="auto" />

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]

<h4>
    <a href="https://codesandbox.io/s/github/kubb-labs/kubb/tree/main//examples/typescript" target="_blank">View Demo</a>
    <span> · </span>
      <a href="https://kubb.dev/" target="_blank">Documentation</a>
    <span> · </span>
      <a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Report Bug</a>
    <span> · </span>
      <a href="https://github.com/kubb-labs/kubb/issues/" target="_blank">Request Feature</a>
  </h4>
</div>

## Install

```bash
npm i -D unplugin-kubb @kubb/core
```

```typescript
import kubb from 'unplugin-kubb/vite'

export default defineConfig({
  plugins: [
    kubb({/* options */}),
  ],
})
```

```typescript
import kubb from 'unplugin-kubb/rollup'

export default {
  plugins: [
    kubb({/* options */}),
  ],
}
```

```typescript
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-kubb/webpack')({/* options */}),
  ],
}
```

```typescript
export default defineNuxtConfig({
  modules: [
    ['unplugin-kubb/nuxt', {/* options */}],
  ],
})
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

```typescript
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-kubb/webpack')({/* options */}),
    ],
  },
}
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

Kubb uses an MIT-licensed open source project with its ongoing development made possible entirely by the support of Sponsors. If you would like to become a sponsor, please consider:

- [Become a Sponsor on GitHub](https://github.com/sponsors/stijnvanhulle)

<p align="center">
  <a href="https://github.com/sponsors/stijnvanhulle">
    <img src="https://raw.githubusercontent.com/stijnvanhulle/sponsors/main/sponsors.svg" alt="My sponsors" />
  </a>
</p>


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
