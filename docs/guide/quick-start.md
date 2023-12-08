---
layout: doc

title: Quick start
outline: deep
---

# Quick start

## Intro

The easiest way to get started with Kubb is just run the following in your cli.
Kubb will search based on the [configuration order](/guide/configure#usage) which file/config it needs to use.

::: tip
When using an `import` statement you need to set `"type": "module"` in your `package.json`.

You can also rename your file to `kubb.config.mjs` to use ESM or `kubb.config.cjs` for CJS.
:::

```bash
kubb
```

## Simple example

```bash
kubb --config kubb.config.js
```

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'

export default defineConfig(async () => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
    },
    plugins: [],
  }
})
```

:::

## Advanced example

::: tip
Since version `2.x.x` we also support using multiple entry(OpenAPI/Swagger) files.
:::

```bash
kubb --config kubb.config.js
```

::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
import createSwaggerTS from '@kubb/swagger-ts'

export default defineConfig(async () => {
  return [
    {
      root: '.',
      input: {
        path: './petStore.yaml',
      },
      output: {
        path: './src/gen',
      },
      plugins: [
        createSwagger({}),
        createSwaggerTS({}),
        createSwaggerTanstackQuery({}),
      ],
    },
    {
      root: '.',
      input: {
        path: './petStore2.yaml',
      },
      output: {
        path: './src/gen2',
      },
      plugins: [
        createSwagger({}),
        createSwaggerTS({}),
        createSwaggerTanstackQuery({}),
      ],
    },
  ]
})
```

:::

If you're looking for a fully functioning example, please have a look at our [simple CodesSandbox example](https://codesandbox.io/s/github/kubb-project/kubb/tree/main/examples/typescript).
