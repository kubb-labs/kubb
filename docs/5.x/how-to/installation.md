---
layout: doc
title: Installation
description: Install Kubb, the plugins your output needs, and verify the CLI.
outline: [2, 3]
order: 1
navigation:
  title: Installation
  icon: i-iconoir-download
---

# Installation

Install Kubb in an existing project. To learn generation with a supplied specification and expected output, follow [Generate your first client](/docs/5.x/tutorials/quickstart) instead.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or higher.
- TypeScript 5 or higher if you use a TypeScript config or import generated types.

::steps{level="2"}

## Install Kubb and your plugins

`kubb` ships the CLI, the core runtime, the OpenAPI adapter, and the TypeScript, TSX, and Markdown parsers. Each output comes from its own plugin package, so install only the [plugins](/extensions/kind/plugins) you need. This example adds the TypeScript plugin:

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

Install the runtime libraries your output needs too. An Axios client uses `axios`, and React Query hooks use `react` and `@tanstack/react-query`. Each plugin page lists its requirements.

## Verify the installation

```shell [Terminal]
npx kubb --version
```

Use `pnpm exec kubb`, `yarn kubb`, or `bunx kubb` with the matching package manager.

## Create a config

Run the [initialization wizard](/docs/5.x/reference/commands/init) to choose your specification, output directory, and plugins, or write `kubb.config.ts` yourself with one of the [stacks](/docs/5.x/how-to/recipes).

```shell [Terminal]
npx kubb init
```

Then run `npx kubb generate`. Kubb writes the generated files to `output.path`.

::

## Add plugins later

Once the config exists, [`kubb add`](/docs/5.x/reference/commands/add) installs a plugin at the version the [Kubb registry](/docs/5.x/reference/registry) pins and adds it to `kubb.config.ts`:

```shell [Terminal]
npx kubb add plugin-zod
```

Run [`kubb list`](/docs/5.x/reference/commands/list) to see your extensions and [`kubb update`](/docs/5.x/reference/commands/update) to move them to the pinned versions.

## See also

- [Generate your first client](/docs/5.x/tutorials/quickstart): a complete example with a supplied specification
- [Configuration reference](/docs/5.x/reference/configuration): every option and default
