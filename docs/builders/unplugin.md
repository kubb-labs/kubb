---
layout: doc

title: unplugin-kubb
outline: deep
---

# unplugin-kubb

Kubb plugin for Vite, webpack, esbuild, Rollup, Nuxt, Astro and Rspack.

> [!TIP]
> The `hook` option will not work with Unplugin. If you need to run Prettier or ESLint after the generation, use Kubb CLI instead.


## Installation

::: code-group

```shell [bun]
bun add -d unplugin-kubb @kubb/core
```

```shell [pnpm]
pnpm add -D unplugin-kubb @kubb/core
```

```shell [npm]
npm install --save-dev unplugin-kubb @kubb/core
```

```shell [yarn]
yarn add -D unplugin-kubb @kubb/core
```

:::

## Options

### config

Define the options for Kubb.


::: code-group
```typescript twoslash [Options]
import type { UserConfig } from "@kubb/core"

type Options = {
  config: UserConfig
}
```

```typescript twoslash [vite.config.ts]
import kubb from 'unplugin-kubb/vite'
import { defineConfig as defineViteConfig } from 'vite'
import { defineConfig, UserConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export const config: UserConfig = {
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
  ],
}

// https://vitejs.dev/config/
export default defineViteConfig({
  plugins: [
    kubb({
      config,
    }),
  ],
})
```
:::

## Examples



::: code-group

```ts [Vite]
// vite.config.ts
import kubb from 'unplugin-kubb/vite'

export default defineConfig({
  plugins: [
    kubb({/* options */}),
  ],
})
```

```js [Rollup]
// rollup.config.js
import kubb from 'unplugin-kubb/rollup'

export default {
  plugins: [
    kubb({/* options */}),
  ],
}
```

```js [webpack]
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-kubb/webpack')({/* options */}),
  ],
}
```

```js [Rspack]
// rspack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-kubb/rspack')({ /* options */ })
  ]
}
```

```js [esbuild]
// esbuild.config.js
import { build } from 'esbuild'
import kubb from 'unplugin-kubb/esbuild'

build({
  plugins: [
    kubb({/* options */}),
  ],
})
```

```js [Vue-CLI]
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-kubb/webpack')({/* options */}),
    ],
  },
}
```

```js [Nuxt]
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    ['unplugin-kubb/nuxt', {/* options */}],
  ],
})
```
```js [Astro]
// astro.config.mjs
import { defineConfig } from 'astro/config'
import Kubb from 'unplugin-kubb/astro'

// https://astro.build/config
export default defineConfig({
  integrations: [
    Kubb({/* options */})
  ]
})
```
:::


## Links

- [Vite](https://vitejs.dev/)
