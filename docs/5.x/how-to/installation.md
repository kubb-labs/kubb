---
layout: doc
title: Install Kubb with npm, pnpm, Yarn, or Bun
description: Set up Kubb in an existing project with the kubb init wizard or by hand with npm, pnpm, Yarn, or Bun, verify the version, and add plugins later with kubb add.
outline: [2, 3]
order: 1
navigation:
  title: Installation
  icon: i-iconoir-download
---

# Install Kubb with npm, pnpm, Yarn, or Bun

Add Kubb to an existing project. To learn with a sample spec first, follow [Generate your first client](/docs/5.x/tutorials/quickstart).

## Prerequisites

- [Node.js](https://nodejs.org/) 22.22 or later.
- TypeScript 5 or later to type-check the generated code.

## Set up with the wizard

`kubb init` installs `kubb` and the plugins you choose, writes `kubb.config.ts`, adds a `generate` script to `package.json` when it has none, and runs the first generation. It installs with the package manager that your `packageManager` field or lockfile names, or with npm.

::code-group{sync="package-manager"}

```shell [pnpm]
pnpm dlx kubb init
```

```shell [npm]
npx kubb init
```

```shell [yarn]
yarn dlx kubb init
```

```shell [bun]
bunx kubb init
```

::

See [`kubb init`](/docs/5.x/reference/commands/init) for its questions and for flags such as `--yes`, `--input`, and `--plugins`.

## Install by hand

::steps{level="3"}

### Install Kubb and your plugins

Each output comes from its own plugin package, so install `kubb` and only the [plugins](/extensions/kind/plugins) you need. This example adds the TypeScript plugin:

:::code-group{sync="package-manager"}

```shell [pnpm]
pnpm add -D kubb @kubb/plugin-ts typescript
```

```shell [npm]
npm install -D kubb @kubb/plugin-ts typescript
```

```shell [yarn]
yarn add -D kubb @kubb/plugin-ts typescript
```

```shell [bun]
bun add -d kubb @kubb/plugin-ts typescript
```

:::

### Verify the installation

:::code-group{sync="package-manager"}

```shell [pnpm]
pnpm exec kubb --version
```

```shell [npm]
npx kubb --version
```

```shell [yarn]
yarn kubb --version
```

```shell [bun]
bunx kubb --version
```

:::

### Create the config

Write `kubb.config.ts` in the project root with your spec as `input`, an `output.path`, and your plugins. Copy one of the [stacks](/docs/5.x/how-to/recipes#pick-a-stack), or see the [configuration reference](/docs/5.x/reference/configuration) for every option.

### Generate

:::code-group{sync="package-manager"}

```shell [pnpm]
pnpm exec kubb generate
```

```shell [npm]
npx kubb generate
```

```shell [yarn]
yarn kubb generate
```

```shell [bun]
bunx kubb generate
```

:::

Kubb writes the generated files to `output.path`.

::

## Install runtime libraries

> [!IMPORTANT]
> `kubb init` and `kubb add` install Kubb packages only, not the libraries your generated code imports. An Axios client needs `axios`, and React Query hooks need `react` and `@tanstack/react-query`. Each plugin page lists its requirements.

## Add plugins later

Once `kubb.config.ts` exists, manage extensions from the [Kubb registry](/docs/5.x/reference/registry) with these commands:

| Command | What it does |
| --- | --- |
| [`kubb add plugin-zod`](/docs/5.x/reference/commands/extensions#add) | Installs the plugin at the version the registry pins and adds it to `kubb.config.ts` |
| [`kubb list`](/docs/5.x/reference/commands/extensions#list) | Lists installed extensions, their versions, and available updates |
| [`kubb update`](/docs/5.x/reference/commands/extensions#update) | Moves installed extensions to the pinned versions, regenerates, and summarizes the file changes |
| [`kubb remove plugin-zod`](/docs/5.x/reference/commands/extensions#remove) | Removes the plugin from `kubb.config.ts` and uninstalls its package |
