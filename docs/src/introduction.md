---
layout: doc

title: Introduction
outline: deep
---
<script setup>

import { version } from '../../packages/core/package.json'

</script>

# Introduction

## Installation

<Badge type="tip" :text="version" /> 
You can install Kubb via [NPM](https://www.npmjs.com/).

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

<Badge type="warning" text="canary" /> 
Kubb also publishes a canary version on every commit. To install the canary:

::: code-group

```shell [bun]
bun add @kubb/cli@canary @kubb/core@canary
```

```shell [pnpm]
pnpm add @kubb/cli@canary @kubb/core@canary
```

```shell [npm]
npm install @kubb/cli@canary @kubb/core@canary
```

```shell [yarn]
yarn add @kubb/cli@canary @kubb/core@canary
```

:::

## Configuration File

Kubb uses [Cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for the configuration file support. 
This means you can configure Kubb via (in order of precedence):

- A "kubb" key in your package.json file.
- A `.kubbrc` file written in JSON or YAML.
- A `.kubbrc.json` file.
- A `.kubbrc.js`, `.kubbrc.cjs`, `kubb.config.js`, or `kubb.config.cjs` file that exports an object using module.exports.
- A `.kubbrc.ts` or `kubb.config.ts` file that exports an object using export default.

See [kubb.config.js](/configuration/configure) on how to configure Kubb.