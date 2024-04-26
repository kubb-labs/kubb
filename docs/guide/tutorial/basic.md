---
layout: doc

title: Basic tutorial
outline: deep
---

# Basic tutorial

This tutorial will describe how you can set up Kubb and use the [`@kubb/swagger-ts`](/plugins/swagger-ts/) plugin to generate types based on the `petStore.yaml` file.

The setup will contain from the beginning the following folder structure:

```typescript
.
├── src
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Step one

Set up your `kubb.config.ts` file based on the [Quick start](/guide/quick-start).

We will add the plugins [`@kubb/swagger`](/plugins/swagger) and [`@kubb/swagger-ts`](/plugins/swagger-ts)(which is dependent on the [`@kubb/swagger`](/plugins/swagger) plugin). Together these two plugins will generate the TypeScript types.

Next to that, we will also set `output` to false for the [`@kubb/swagger`](/plugins/swagger) plugin because we do not need the plugin to generate the JSON schemas for us.

- For the [`@kubb/swagger-ts`](/plugins/swagger-ts/) plugin, we will set the `output` to the `models` folder.

::: code-group

```typescript [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig(async () => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src',
    },
    plugins: [
      createSwagger(
        {
          output: false,
          validate: true,
        },
      ),
      createSwaggerTS(
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

```typescript
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

Update your `package.json` and install `Kubb`, see the [installation](/guide/installation).

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
    "@kubb/swagger-ts": "latest"
  }
}
```

:::

## Step three

Run the Kubb script with the following command.

::: code-group

```shell [bun <img src="/feature/bun.svg"/>]
bun run generate
```

```shell [pnpm <img src="/feature/pnpm.svg"/>]
pnpm run generate
```

```shell [npm <img src="/feature/npm.svg"/>]
npm run generate
```

```shell [yarn <img src="/feature/yarn.svg"/>]
yarn run generate
```

:::

## Step four

Drink a 🍺 and watch Kubb generate your files.

<img src="/kubb-generate.gif" style="{ display: 'inline' }" alt="Kubb generation" />
