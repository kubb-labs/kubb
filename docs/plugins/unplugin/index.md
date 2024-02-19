---
layout: doc

title: unplugin-kubb
outline: deep
---

# unplugin-kubb <a href="https://paka.dev/npm/unplugin-kubb@latest/api">🦙</a>

Kubb plugin for Vite, webpack, esbuild, Rollup, Nuxt, Astro and Rspack.

## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add unplugin-kubb @kubb/core
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add unplugin-kubb @kubb/core
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install unplugin-kubb @kubb/core
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add unplugin-kubb @kubb/core
```

:::

## Options

### config

Define the options for Kubb.

::: info type

```typescript [Options]
type Options = {
  config: UserConfig
}
```

:::

::: info

Type: `Options` <br/>

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
import createSwaggerTS from '@kubb/swagger-ts'

/** @type {import('@kubb/core').UserConfig} */
export const config = {
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({
      output: {
        path: 'models',
      },
    }),
  ],
}
```

```typescript [vite.config.ts]
import react from '@vitejs/plugin-react'
import kubb from 'unplugin-kubb/vite'
import { defineConfig } from 'vite'
import { config } from './kubb.config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    kubb({
      config,
    }),
  ],
})
```

:::

## Examples

### Vite

```ts
// vite.config.ts
import Plugin from 'unplugin-kubb/vite'

export default defineConfig({
  plugins: [
    Plugin({/* options */}),
  ],
})
```

### Rollup

```ts
// rollup.config.js
import Plugin from 'unplugin-kubb/rollup'

export default {
  plugins: [
    Plugin({/* options */}),
  ],
}
```

### webpack

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-kubb/webpack')({/* options */}),
  ],
}
```

### Nuxt

```ts
// nuxt.config.js
export default defineNuxtConfig({
  modules: [
    ['unplugin-kubb/nuxt', {/* options */}],
  ],
})
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

### Vue CLI

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

### esbuild

```ts
// esbuild.config.js
import { build } from 'esbuild'
import Plugin from 'unplugin-kubb/esbuild'

build({
  plugins: [Plugin()],
})
```

## Depended

- [`@kubb/core`](/plugins/core/)

## Links

- [Vite](https://vitejs.dev/)
