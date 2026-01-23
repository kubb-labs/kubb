---
layout: doc

title: Basic tutorial
outline: deep
---

# Basic tutorial

This tutorial describes how to set up Kubb and use the [`@kubb/plugin-ts`](/plugins/plugin-ts/) plugin to generate types based on the `petStore.yaml` file.

The setup contains the following folder structure:

```
.
├── src
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Step one

Set up your `kubb.config.ts` file based on the [Quick start](/guide/quick-start).

Add the plugins [`@kubb/plugin-oas`](/plugins/plugin-oas/) and [`@kubb/plugin-ts`](/plugins/plugin-ts/) (which depends on [`@kubb/plugin-oas`](/plugins/plugin-oas/)). These two plugins generate the TypeScript types.

Set `generators` to an empty array for the [`@kubb/plugin-oas`](/plugins/plugin-oas) plugin since you don't need the plugin to generate JSON schemas.

- For the [`@kubb/plugin-ts`](/plugins/plugin-ts/) plugin, set `output` to the `models` folder.

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src',
    },
    plugins: [
      pluginOas(
        {
          generators: [],
          validate: true,
        },
      ),
      pluginTs(
        {
          output: {
            path: 'models',
          },
        },
      ),
    ],
  }
})
```

:::

This creates the following folder structure after Kubb executes:

```
.
├── src/
│   └── models/
│       ├── typeA.ts
│       └── typeB.ts
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Step two

Update your `package.json` and install Kubb. See [installation instructions](/getting-started/configure/).

Your `package.json` looks like this:

::: code-group

```json [package.json]
{
  "name": "your project",
  "scripts": {
    "generate": "kubb generate --config kubb.config.ts"
  },
  "dependencies": {
    "@kubb/cli": "latest",
    "@kubb/core": "latest",
    "@kubb/swagger": "latest",
    "@kubb/plugin-ts": "latest"
  }
}
```

:::

## Step three

Run the Kubb script with the following command.

::: code-group

```shell [bun]
bun run generate
```

```shell [pnpm]
pnpm run generate
```

```shell [npm]
npm run generate
```

```shell [yarn]
yarn run generate
```

:::

## Step four

Kubb generates your files. Below is an example of the generation process:

<img src="../public/kubb-generate.gif" style="{ display: 'inline' }" alt="Kubb generation" />
