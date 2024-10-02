---
layout: doc

title: Basic tutorial
outline: deep
---

# Basic tutorial

This tutorial will describe how you can set up Kubb and use the [`@kubb/plugin-ts`](/plugins/plugin-ts/) plugin to generate types based on the `petStore.yaml` file.

The setup will contain from the beginning the following folder structure:

```
.
├── src
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Step one

Set up your `kubb.config.ts` file based on the [Quick start](/guide/quick-start).

We will add the plugins [`@kubb/plugin-oas`](/plugins/plugin-oas/) and [`@kubb/plugin-ts`](/plugins/plugin-ts/)(which is dependent on the [`@kubb/plugin-oas`](/plugins/plugin-oas/) plugin). Together these two plugins will generate the TypeScript types.

Next to that, we will also set `output` to false for the [`@kubb/swagger`](/plugins/swagger) plugin because we do not need the plugin to generate the JSON schemas for us.

- For the [`@kubb/plugin-ts`](/plugins/plugin-ts/) plugin, we will set the `output` to the `models` folder.

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
          output: false,
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

This will result in the following folder structure when Kubb has been executed

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

Update your `package.json` and install `Kubb`, see the [installation](/getting-started/configure/).

Your `package.json` will look like this:

::: code-group

```json [package.json]
{
  "name": "your project",
  "scripts": {
    "generate": "kubb generate --config kubb.config.js"
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

Drink a 🍺 and watch Kubb generate your files.

<img src="/kubb-generate.gif" style="{ display: 'inline' }" alt="Kubb generation" />
