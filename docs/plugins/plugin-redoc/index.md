---
layout: doc

title: \@kubb/plugin-redoc
outline: deep
---

# @kubb/plugin-redoc

With the Redoc plugin you can create beautiful docs pages.
<hr/>
## Installation

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/plugin-redoc
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/plugin-redoc
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/plugin-redoc
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/plugin-redoc
```

:::

## Options

### output
#### output.path

Output for the generated doc, we are using [https://redocly.com/](https://redocly.com/) for the generation<br/>

::: info
Type: `string | false` <br/>
Default: `'docs.html'`

::: code-group

```typescript
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({
  output: {
    path: './docs/index.html',
  },
})
```
:::

## Example

```typescript
import { defineConfig } from '@kubb/core'
import { pluginRedoc } from '@kubb/plugin-redoc'

export default defineConfig({
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
  },
  plugins: [
    pluginRedoc({
      output: {
        path: './docs/index.html',
      },
    }),
  ],
})
```

## Links
