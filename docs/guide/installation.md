---
layout: doc

title: Introduction
outline: deep
---

<script setup>

import { version } from '../../packages/core/package.json'

</script>

# Installation

## Environment

### Node.js version <Badge type="tip" text="&gt;18" />

**Kubb has a minimal support of Node.js version 18.0.0.**

::: warning
**Node.js versions prior to Node.js 18 are no longer supported.** To use Kubb, please migrate to Node.js 18 or higher. <br/><br/>
[https://nodejs.org/en/blog/announcements/nodejs16-eol](https://nodejs.org/en/blog/announcements/nodejs16-eol)
:::

### TypeScript version <Badge type="tip" text="&gt;4.7" />

**Kubb has a minimal support of TypeScript version 4.7**. <br/>
If you are using an older TypeScript version, please migrate to version 4.7 or later to use Kubb. Please consider that at the moment of writing this TypeScript 4.6 is almost two years old.

## Latest <Badge type="tip" :text="version" />

You can install Kubb via [NPM](https://www.npmjs.com/).

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

## Canary <Badge type="tip" text="canary" />

Kubb also publishes a canary version on every commit to the main branch. <br/>
To install the canary version:

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/cli@canary @kubb/core@canary
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/cli@canary @kubb/core@canary
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/cli@canary @kubb/core@canary
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/cli@canary @kubb/core@canary
```

:::

## Beta <img src="/icons/experimental.svg"/> <Badge type="tip" text="beta" />

Kubb also publishes a beta version which contains experimental features that are not production ready.

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/cli@beta @kubb/core@beta
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/cli@beta @kubb/core@beta
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/cli@beta @kubb/core@beta
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/cli@beta @kubb/core@alpha
```

:::

## Alpha <img src="/icons/experimental.svg"/> <Badge type="tip" text="alpha" />

Kubb also publishes an alpha version which contains experimental features that are not production ready.

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun add @kubb/cli@alpha @kubb/core@alpha
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm add @kubb/cli@alpha @kubb/core@alpha
```

```shell [npm <img src="/feature/npm.svg"/>]
npm install @kubb/cli@alpha @kubb/core@alpha
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn add @kubb/cli@alpha @kubb/core@alpha
```

:::
