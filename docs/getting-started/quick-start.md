---
layout: doc

title: Quick Start
outline: deep
---

<script setup>

import { version } from '../../packages/core/package.json'

</script>

# Quick Start

## Installation <Badge type="tip" :text="version" />

### Pre-requisites

- Node.js <Badge type="tip" text="&gt;20" />
- TypeScript version <Badge type="tip" text="&gt;4.7" />

> [!INFO]
> Node.js versions prior to Node.js 20 are no longer supported. To use Kubb, please migrate to Node.js 20 or higher.

> [!INFO]
> **Kubb has a minimal support of TypeScript version 4.7**.
If you are using an older TypeScript version, please migrate to version 4.7 or later to use Kubb. Please consider that at the moment of writing this TypeScript 4.6 is almost two years old.

### Install Kubb
You can install Kubb via [bun](https://bun.sh/), [pnpm](https://pnpm.io/), [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/).

::: code-group
```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/cli @kubb/core
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/cli @kubb/core
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/cli @kubb/core
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/cli @kubb/core
```
:::

## Usage with the CLI
The simplest way to get started with Kubb is to configure the following in your `package.json` and Kubb will automatically determine which file or configuration to use based on the [order specified](/getting-started/configure#usage).

```json
"scripts": {
  "generate": "kubb generate"
}
```

> [!TIP]
> When using an `import` statement you need to set `"type": "module"` in your `package.json`.
> You can also rename your file to `kubb.config.mjs` to use ESM or `kubb.config.cjs` for CJS.
>
> If you’re using a configuration file other than the default `kubb.config.ts`, specify it with `--config kubb.config.js`.

Run `pnpm run generate` or `npx kubb generate`.

## Usage with Node.js

```typescript [index.js]
import { write } from '@kubb/fs'
import { build, getSource } from '@kubb/core'

const { error, files, pluginManager } = await build({
  config: {
    root: '.',
    input: {
      data: '',
    },
    output: {
      path: './gen',
    },
  },
})


for (const file of files) {
  const source = await getSource(file)

  await write(source, file.path)
}
```

## Example

::: code-group
```typescript twoslash [single]
import { defineConfig } from '@kubb/core'

export default defineConfig(() => {
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

```typescript twoslash [multiple]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
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
        pluginOas({}),
        pluginTs({}),
        pluginReactQuery({}),
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
        pluginOas({}),
        pluginTs({}),
        pluginReactQuery({}),
      ],
    },
  ]
})
```
:::


If you're looking for a fully functioning example, please have a look at our [simple CodesSandbox example](https://codesandbox.io/s/github/kubb-labs/kubb/tree/main/examples/typescript).
