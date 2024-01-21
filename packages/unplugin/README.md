<div align="center">

<!-- <img src="assets/logo.png" alt="logo" width="200" height="auto" /> -->
<h1>unplugin-tsup</h1>

<p>
   Kubb plugin for Vite, Webpack, Esbuild, Rollup, Nuxt, Astro and Rspack.
  </p>
  <img src="https://raw.githubusercontent.com/kubb-project/kubb/main/assets/banner.png" alt="logo"  height="auto" />

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Coverage][coverage-src]][coverage-href]
[![License][license-src]][license-href]

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

<h4>
    <a href="https://codesandbox.io/s/github/kubb-project/kubb/tree/alpha/examples/typescript" target="_blank">View Demo</a>
    <span> · </span>
      <a href="https://kubb.dev/" target="_blank">Documentation</a>
    <span> · </span>
      <a href="https://github.com/kubb-project/kubb/issues/" target="_blank">Report Bug</a>
    <span> · </span>
      <a href="https://github.com/kubb-project/kubb/issues/" target="_blank">Request Feature</a>
  </h4>
</div>

## Install

```bash
npm i -D unplugin-kubb
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import Plugin from 'unplugin-kubb/vite'

export default defineConfig({
  plugins: [
    Plugin({/* options */}),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import Plugin from 'unplugin-kubb/rollup'

export default {
  plugins: [
    Plugin({/* options */}),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-kubb/webpack')({/* options */}),
  ],
}
```

<br></details>

<details>
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    ['unplugin-kubb/nuxt', {/* options */}],
  ],
})
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-kubb/webpack')({/* options */}),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import Plugin from 'unplugin-kubb/esbuild'

build({
  plugins: [Plugin()],
})
```

<br></details>

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/unplugin-kubb?flat&colorA=18181B&colorB=f58517
[npm-version-href]: https://npmjs.com/package/unplugin-kubb
[npm-downloads-src]: https://img.shields.io/npm/dm/unplugin-kubb?flat&colorA=18181B&colorB=f58517
[npm-downloads-href]: https://npmjs.com/package/unplugin-kubb
[license-src]: https://img.shields.io/github/license/kubb-project/kubb.svg?flat&colorA=18181B&colorB=f58517
[license-href]: https://github.com/kubb-project/kubb/blob/main/LICENSE
[build-src]: https://img.shields.io/github/actions/workflow/status/kubb-project/kubb/ci.yaml?style=flat&colorA=18181B&colorB=f58517
[build-href]: https://www.npmjs.com/package/unplugin-kubb
[minified-src]: https://img.shields.io/bundlephobia/min/unplugin-kubb?style=flat&colorA=18181B&colorB=f58517
[minified-href]: https://www.npmjs.com/package/unplugin-kubb
[coverage-src]: https://img.shields.io/codecov/c/github/kubb-project/kubb?style=flat&colorA=18181B&colorB=f58517
[coverage-href]: https://www.npmjs.com/package/unplugin-kubb
