---
layout: doc

title: Basic guide
outline: deep
---

# Basic guide
This guide will describe how you can setup Kubb + use the TypeScript plugin to generate types based on the `petStore.yaml` file.

The setup will contain from the beginning the following folder structure

```typescript
.
├── src
├── petStore.yaml
├── kubb.config.js
└── package.json
```

## Step one
Setup your `kubb.config.js` file based on the [Quick-start](/quick-start).

We will add here the [Swagger](/plugins/swagger) and [SwaggerTypescript](/plugins/swagger-ts)(which is depended on the [Swagger](/plugins/swagger) plugin) plugin, those 2 plugins together will generate the TypeScript types.


- Next to that we will also set `output` to false for the [Swagger](/plugins/swagger) plugin because we don't need the plugin to generate the JSON schemas for us.
- For the [SwaggerTypescript](/plugins/swagger-ts) plugin we will set the `output` to the models folder.


::: code-group

```typescript [kubb.config.js]
import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'
 
export default defineConfig(async () => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src',
    },
    plugins: [createSwagger({ output: false, validate: true }), createSwaggerTS({ output: 'models' })],
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
├── kubb.config.js
└── package.json
```

## Step two
Update your `package.json` and install `Kubb`, see [installation](/introduction.html#configuration-file).

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
