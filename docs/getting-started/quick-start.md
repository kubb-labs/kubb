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
```shell [bun]
bun add @kubb/cli @kubb/core
```

```shell [pnpm]
pnpm add @kubb/cli @kubb/core
```

```shell [npm]
npm install @kubb/cli @kubb/core
```

```shell [yarn]
yarn add @kubb/cli @kubb/core
```
:::

## Usage with the CLI

> [!TIP]
> When using an `import` statement you need to set `"type": "module"` in your `package.json`.
> You can also rename your file to `kubb.config.mjs` to use ESM or `kubb.config.cjs` for CJS.
>
> If you’re using a custom configuration, specify it with `--config kubb.config.js` or `--config FILE_NAME.js`.

The simplest way to get started with Kubb is to configure your `package.json` to include Kubb. Create a `kubb.config.ts` setup file and run the **Kubb generate command**.
Kubb will automatically determine which file or configuration to use based on an [order](/getting-started/configure#usage).

::: code-group
```json [package.json]
"scripts": {
  "generate": "kubb generate"
}
```

```typescript twoslash [kubb.config.ts]
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
```shell [bash]
bun run generate
# or
pnpm run generate
# or
npm run generate
# or
yarn run generate
# or
npx kubb generate
```
:::

![React-DevTools](/screenshots/cli.gif)

## Usage with Node.js
When the cli is not an option, you could use the `@kubb/core` package to trigger the generation. This is the same as the cli but without an interface or progressbar.
```typescript [index.ts]
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
