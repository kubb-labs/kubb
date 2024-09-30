---
layout: doc

title: \@kubb/plugin-redoc
outline: deep
---

# @kubb/plugin-redoc

With the Redoc plugin you can create beautiful documentation.

## Installation

::: code-group

```shell [bun]
bun add @kubb/plugin-redoc
```

```shell [pnpm]
pnpm add @kubb/plugin-redoc
```

```shell [npm]
npm install @kubb/plugin-redoc
```

```shell [yarn]
yarn add @kubb/plugin-redoc
```
:::

## Options

### output
#### output.path

Output for the generated doc.
For the generation we are using [https://redocly.com/](https://redocly.com/).

|           |                |
|----------:|:---------------|
|     Type: | `string`       |
| Required: | `false`        |
|  Default: | `'docs.html'`  |

```typescript twoslash
import { pluginOas } from '@kubb/plugin-oas'

const plugin = pluginOas({
  output: {
    path: './docs/index.html',
  },
})
```

## Example

```typescript twoslash [kubb.config.ts]
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

- [https://redocly.com/](https://redocly.com/)
