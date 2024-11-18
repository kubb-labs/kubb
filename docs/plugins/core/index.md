---
layout: doc

title: \@kubb/core
outline: deep
---

# @kubb/core
The core contains the building blocks for all plugins.

## Installation

::: code-group

```shell [bun]
bun add @kubb/core
```

```shell [pnpm]
pnpm add @kubb/core
```

```shell [npm]
npm install @kubb/core
```

```shell [yarn]
yarn add @kubb/core
```

:::

## Usage

```typescript
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

  await write(file.path, file)
}
```

Start the build process based on a defined config(see [UserConfig](https://github.com/kubb-labs/kubb/blob/main/packages/core/src/config.ts) type).
This will trigger the different plugins and their created lifecycle methods.
