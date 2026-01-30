---
layout: doc

title: Kubb ReDoc Plugin - Generate API Documentation
description: Generate beautiful API documentation with ReDoc from OpenAPI specs using @kubb/plugin-redoc.
outline: deep
---

# @kubb/plugin-redoc

Generate API documentation using [Redoc](https://redocly.com/).

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/plugin-redoc
```

```shell [pnpm]
pnpm add -D @kubb/plugin-redoc
```

```shell [npm]
npm install --save-dev @kubb/plugin-redoc
```

```shell [yarn]
yarn add -D @kubb/plugin-redoc
```
:::

## Options

### output
#### output.path

The output location for the generated documentation.

This plugin uses [Redocly](https://redocly.com/) for HTML generation.

|           |                |
|----------:|:---------------|
|     Type: | `string`       |
| Required: | `false`        |
|  Default: | `'docs.html'`  |


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

## See Also

- [https://redocly.com/](https://redocly.com/)
