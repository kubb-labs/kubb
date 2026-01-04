---
layout: doc

title: Quick Start
outline: deep
---

<script setup>

import { version } from '../../packages/core/package.json'

</script>

# Quick Start

## Prerequisites

- **Node.js**: Version 20 or higher
- **TypeScript**: Version 4.7 or higher (if using TypeScript)

> [!NOTE]
> Node.js 20 is required. Earlier versions are not supported.

## Installation <Badge type="tip" :text="version" />

Install the core packages:

::: code-group
```shell [bun]
bun add -d @kubb/cli @kubb/core
```

```shell [pnpm]
pnpm add -D @kubb/cli @kubb/core
```

```shell [npm]
npm install --save-dev @kubb/cli @kubb/core
```

```shell [yarn]
yarn add -D @kubb/cli @kubb/core
```
:::

These provide the CLI and core functionality. Add plugins as needed (see [plugin documentation](/plugins/)).

## Basic Setup

**1. Create a configuration file** - `kubb.config.ts` in your project root:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml', // Path to your OpenAPI spec
  },
  output: {
    path: './src/gen', // Where to output generated files
  },
  plugins: [], // Add plugins here
})
```

**2. Add a script to package.json**:

```json [package.json]
{
  "scripts": {
    "generate": "kubb generate"
  }
}
```

**3. Run generation**:

```shell
bun run generate
# or
pnpm run generate
# or
npm run generate
# or
yarn run generate
```

> [!TIP]
> Kubb automatically detects config files in this order: `kubb.config.ts`, `kubb.config.js`, `kubb.config.mjs`, `kubb.config.cjs`.
> Use `--config <path>` to specify a custom config file location.

> [!NOTE]
> **Using ESM**: If using `import` statements, add `"type": "module"` to `package.json`, or use `.mjs` extension for the config file.

![CLI in action](/screenshots/cli.gif)


## Programmatic Usage (Node.js API)

Use `@kubb/core` directly when the CLI isn't suitable (e.g., custom build scripts, monorepo tooling).

```typescript twoslash [generate.ts]
import { write } from '@kubb/fs'
import { build, getSource } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

const { error, files, pluginManager } = await build({
  config: {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './gen',
    },
    plugins: [
      pluginOas(),
      pluginTs(),
    ]
  },
})

if (error) {
  console.error(error)
  process.exit(1)
}

for (const file of files) {
  const source = await getSource(file)
  await write(source, file.path)
}
```

> [!NOTE]
> The Node.js API provides the same functionality as the CLI, but without progress bars or colored output.

## Examples

### Single Config with Plugins

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true, // Remove old files before generating
  },
  plugins: [
    pluginOas(), // Parse OpenAPI spec
    pluginTs(), // Generate TypeScript types
    pluginReactQuery(), // Generate React Query hooks
  ],
})
```

### Multiple Configs

Generate code from multiple OpenAPI specs in one command:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig([
  {
    name: 'petStore',
    input: { path: './petStore.yaml' },
    output: { path: './src/gen/petStore' },
    plugins: [pluginOas(), pluginTs()],
  },
  {
    name: 'userApi',
    input: { path: './userApi.yaml' },
    output: { path: './src/gen/userApi' },
    plugins: [pluginOas(), pluginTs()],
  },
])
```

## Next Steps

- [Configure Kubb](/getting-started/configure/) - Full configuration reference
- [Plugin Documentation](/plugins/) - Explore available plugins
- [Examples](https://github.com/kubb-labs/kubb/tree/main/examples) - Complete working examples
