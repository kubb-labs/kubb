---
layout: doc

title: Kubb Quick Start - Generate TypeScript from OpenAPI
description: Quick start guide to generate TypeScript types and API clients from OpenAPI specs with Kubb. Get running in 2 minutes with npx kubb init.
outline: deep
---

<script setup>

</script>

# Kubb Quick Start Guide

**Generate type-safe TypeScript code from OpenAPI specifications in under 2 minutes.** This guide shows you how to set up Kubb and generate your first API client code.

## What You'll Build

By the end of this quick start, you'll have:
- A configured Kubb project
- Auto-generated TypeScript types from your OpenAPI spec
- Type-safe API client functions
- Optional: React Query hooks, Zod schemas, or MSW mocks

## Prerequisites

Before starting, ensure you have:

- **Node.js**: Version 20 or higher ([Download](https://nodejs.org/))
- **TypeScript**: Version 4.7 or higher (if using TypeScript)
- **OpenAPI Specification**: A valid OpenAPI 2.0, 3.0, or 3.1 file (YAML or JSON)

> [!NOTE]
> **Node.js 20 is required.** Earlier versions are not supported. Check your version with `node --version`.

## Quick Setup (Recommended)

**The fastest way to get started** is using Kubb's interactive setup command:

```shell
npx kubb init
```

This interactive wizard will:
1. Detect or create a `package.json` file
2. Ask for your OpenAPI specification file path (e.g., `./openapi.yaml`)
3. Prompt for the output directory (where generated code will be saved)
4. Let you select plugins to install (TypeScript, React Query, Zod, etc.)
5. Automatically install all required npm packages
6. Generate a `kubb.config.ts` configuration file

**Generate your code:**

Once the setup completes, generate your code:

```shell
npx kubb generate
```

**That's it!** Your generated code is now in the output directory, ready to import and use.

> [!TIP]
> The `kubb init` command is the recommended way to start a new Kubb project. It handles all setup automatically and prevents common configuration mistakes.

## Manual Setup

If you prefer manual control over configuration:

### Step 1: Install Packages

Install Kubb's core packages as development dependencies:

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

These packages provide the CLI command and core generation functionality. Additional plugins can be installed as needed.

### Step 2: Create Configuration File

**Create `kubb.config.ts`** in your project root directory:

```typescript twoslash [kubb.config.ts]
import { defineConfig } from '@kubb/core'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml', // Path to your OpenAPI specification file
  },
  output: {
    path: './src/gen', // Where to save generated files
  },
  plugins: [], // Add plugins here (see plugin documentation)
})
```

**Configuration breakdown:**
- `root` - Project root directory (relative to config file)
- `input.path` - Location of your OpenAPI/Swagger file
- `output.path` - Directory for generated code
- `plugins` - Array of Kubb plugins to use

### Step 3: Add NPM Script

**Add a script to `package.json`** for easier code generation:

```json [package.json]
{
  "scripts": {
    "generate": "kubb generate"
  }
}
```

### Step 4: Run Generation

**Generate your code** using the npm script:

```shell
bun run generate
# or
pnpm run generate
# or
npm run generate
# or
yarn run generate
```

**What config files does Kubb recognize?**

Kubb automatically detects configuration files in this order:
1. `kubb.config.ts` (recommended)
2. `kubb.config.js`
3. `kubb.config.mjs`
4. `kubb.config.cjs`

> [!TIP]
> Use `--config <path>` to specify a custom config file location:
> ```shell
> kubb generate --config ./configs/kubb.config.ts
> ```

> [!NOTE]
> **Using ESM**: If using `import` statements, add `"type": "module"` to `package.json`, or use the `.mjs` extension for your config file.

![CLI in action](../public/screenshots/cli.gif)


## Programmatic Usage (Node.js API)

**When to use the programmatic API?** Use `@kubb/core` directly when:
- Building custom tooling or build scripts
- Integrating Kubb into monorepo workflows
- Embedding code generation in automated pipelines

```typescript [generate.ts]
import { build } from '@kubb/core'
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

console.log(files)
```

> [!NOTE]
> The Node.js API provides the same functionality as the CLI, but without progress bars or colored output. Use the CLI for interactive development.

## Configuration Examples

### Example 1: Basic TypeScript + React Query

Generate TypeScript types and React Query hooks from a single OpenAPI file:

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
    pluginOas(), // Required: Parse OpenAPI specification
    pluginTs(), // Generate TypeScript types
    pluginReactQuery(), // Generate React Query hooks
  ],
})
```

### Example 2: Multiple OpenAPI Specifications

Generate code from multiple API specifications in one command:

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

## What to Do Next

Now that you have Kubb set up:

- **[Configuration Guide](/getting-started/configure)** - Learn all available configuration options
- **[Plugin Documentation](/plugins)** - Explore plugins for React Query, Zod, MSW, and more
- **[Working Examples](https://github.com/kubb-labs/kubb/tree/main/examples)** - Browse complete example projects
- **[Best Practices](/guide/best-practices)** - Tips for production use

## Frequently Asked Questions

**Q: What if my OpenAPI file is a URL instead of a local file?**
Kubb supports URLs. Set `input.path` to the full URL (e.g., `https://api.example.com/openapi.json`).

**Q: Can I generate code for only specific API endpoints?**
Yes, use the `include` option in your plugin configuration to filter by tag, path, or operation ID.

**Q: How do I regenerate code after my OpenAPI spec changes?**
Simply run `kubb generate` again. Use `output.clean: true` to remove old files first.

**Q: Does Kubb work with Swagger 2.0?**
Yes, Kubb supports OpenAPI 2.0 (Swagger), OpenAPI 3.0, and OpenAPI 3.1 specifications.

**Q: Can I customize the generated code?**
Yes, through custom generators, transformers, and override options. See the [Generators guide](/guide/generators) for details.
