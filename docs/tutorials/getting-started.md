---
layout: doc
title: Getting Started with Kubb
outline: deep
---

# Tutorial: Getting Started with Kubb

Learn Kubb basics by generating TypeScript types from an OpenAPI specification.

## What You'll Build

A type generator that creates TypeScript types from a `petStore.yaml` OpenAPI specification file.

> [!NOTE]
> Complete the [Installation](/getting-started/installation) and [Configuration](/getting-started/configure) guides before starting this tutorial.

## Step 1: Set Up Your Project Structure

Create the following folder structure:

```
.
├── src
├── petStore.yaml
├── kubb.config.ts
└── package.json
```

## Step 2: Configure Kubb

Create a `kubb.config.ts` file and add the [`@kubb/plugin-oas`](/plugins/plugin-oas/) and [`@kubb/plugin-ts`](/plugins/plugin-ts/) plugins.

Set `generators` to an empty array for the [`@kubb/plugin-oas`](/plugins/plugin-oas) plugin since you only need TypeScript type generation.

For the [`@kubb/plugin-ts`](/plugins/plugin-ts/) plugin, set `output` to the `models` folder.

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

## Step 3: Install Dependencies

Update your `package.json` with the required Kubb packages:

::: code-group

```json [package.json]
{
  "name": "kubb-getting-started",
  "scripts": {
    "generate": "kubb generate"
  },
  "dependencies": {
    "@kubb/cli": "latest",
    "@kubb/core": "latest",
    "@kubb/plugin-oas": "latest",
    "@kubb/plugin-ts": "latest"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
```

:::

Then install the dependencies:

::: code-group

```bash [bun]
bun install
```

```bash [pnpm]
pnpm install
```

```bash [npm]
npm install
```

```bash [yarn]
yarn install
```

:::

## Step 4: Run the Generator

Execute the generator:

::: code-group

```bash [bun]
bun run generate
```

```bash [pnpm]
pnpm run generate
```

```bash [npm]
npm run generate
```

```bash [yarn]
yarn run generate
```

:::

## Step 5: Check the Output

Kubb generates your files in the following structure:

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

Generation process:

<img src="../public/kubb-generate.gif" style="{ display: 'inline' }" alt="Kubb generation" />

## Understanding the Configuration

**pluginOas()** - Parses your OpenAPI specification:
- `generators` - Set to `[]` to skip JSON schema generation
- `validate` - Validates the OpenAPI spec

**pluginTs()** - Generates TypeScript types:
- `output.path` - Where to save generated types (e.g., `models`)

**input.path** - Location of your OpenAPI spec file

**output.path** - Base output directory for all generated files

## Next Steps

- **[Quick Start Guide](/getting-started/quick-start)** - Explore more plugins and features
- **[Plugin TS Documentation](/plugins/plugin-ts/)** - Advanced TypeScript generation options
- **[Configuration Reference](/getting-started/configure)** - Complete configuration options
