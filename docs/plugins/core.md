---
layout: doc

title: Kubb Core Plugin - Base Plugin Configuration
description: Configure Kubb's core plugin options: transformers, generators, barrel files, and advanced code generation settings.
outline: deep
---

# @kubb/core

The core module provides the building blocks for all plugins.

## Installation

::: code-group

```shell [bun]
bun add -d @kubb/core
```

```shell [pnpm]
pnpm add -D @kubb/core
```

```shell [npm]
npm install --save-dev @kubb/core
```

```shell [yarn]
yarn add -D @kubb/core
```

:::

## Usage

```typescript
import { build } from '@kubb/core'

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


console.log(files)
```

Start the build process using a defined config (see [UserConfig](https://github.com/kubb-labs/kubb/blob/main/packages/core/src/config.ts) type).
This triggers the plugins and their lifecycle methods.
