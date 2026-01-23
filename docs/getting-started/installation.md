---
layout: doc

title: Installation
outline: deep
---

# Installation

Install Kubb in your project using your preferred package manager.

## Core Packages

::: code-group

```bash [bun]
bun add -d @kubb/cli @kubb/core
```

```bash [pnpm]
pnpm add -D @kubb/cli @kubb/core
```

```bash [npm]
npm install --save-dev @kubb/cli @kubb/core
```

```bash [yarn]
yarn add -D @kubb/cli @kubb/core
```

:::

## Plugins

Kubb uses a plugin-based architecture. Install the plugins you need for your use case:

### TypeScript Types

Generate TypeScript types from your OpenAPI specification:

::: code-group

```bash [bun]
bun add -d @kubb/plugin-ts
```

```bash [pnpm]
pnpm add -D @kubb/plugin-ts
```

```bash [npm]
npm install --save-dev @kubb/plugin-ts
```

```bash [yarn]
yarn add -D @kubb/plugin-ts
```

:::

### HTTP Clients

Generate HTTP client code with Axios, Fetch, or custom implementations:

::: code-group

```bash [bun]
bun add -d @kubb/plugin-client
```

```bash [pnpm]
pnpm add -D @kubb/plugin-client
```

```bash [npm]
npm install --save-dev @kubb/plugin-client
```

```bash [yarn]
yarn add -D @kubb/plugin-client
```

:::

### Data Fetching Hooks

Generate hooks for popular data fetching libraries:

::: code-group

```bash [bun]
# React Query
bun add -d @kubb/plugin-react-query

# SWR
bun add -d @kubb/plugin-swr

# Vue Query
bun add -d @kubb/plugin-vue-query

# Solid Query
bun add -d @kubb/plugin-solid-query

# Svelte Query
bun add -d @kubb/plugin-svelte-query
```

```bash [pnpm]
# React Query
pnpm add -D @kubb/plugin-react-query

# SWR
pnpm add -D @kubb/plugin-swr

# Vue Query
pnpm add -D @kubb/plugin-vue-query

# Solid Query
pnpm add -D @kubb/plugin-solid-query

# Svelte Query
pnpm add -D @kubb/plugin-svelte-query
```

```bash [npm]
# React Query
npm install --save-dev @kubb/plugin-react-query

# SWR
npm install --save-dev @kubb/plugin-swr

# Vue Query
npm install --save-dev @kubb/plugin-vue-query

# Solid Query
npm install --save-dev @kubb/plugin-solid-query

# Svelte Query
npm install --save-dev @kubb/plugin-svelte-query
```

```bash [yarn]
# React Query
yarn add -D @kubb/plugin-react-query

# SWR
yarn add -D @kubb/plugin-swr

# Vue Query
yarn add -D @kubb/plugin-vue-query

# Solid Query
yarn add -D @kubb/plugin-solid-query

# Svelte Query
yarn add -D @kubb/plugin-svelte-query
```

:::

### Validation & Mocking

::: code-group

```bash [bun]
# Zod schemas
bun add -d @kubb/plugin-zod

# Faker.js mocks
bun add -d @kubb/plugin-faker

# MSW handlers
bun add -d @kubb/plugin-msw
```

```bash [pnpm]
# Zod schemas
pnpm add -D @kubb/plugin-zod

# Faker.js mocks
pnpm add -D @kubb/plugin-faker

# MSW handlers
pnpm add -D @kubb/plugin-msw
```

```bash [npm]
# Zod schemas
npm install --save-dev @kubb/plugin-zod

# Faker.js mocks
npm install --save-dev @kubb/plugin-faker

# MSW handlers
npm install --save-dev @kubb/plugin-msw
```

```bash [yarn]
# Zod schemas
yarn add -D @kubb/plugin-zod

# Faker.js mocks
yarn add -D @kubb/plugin-faker

# MSW handlers
yarn add -D @kubb/plugin-msw
```

:::

## System Requirements

Kubb requires Node.js 20 or higher.

|           |         |
|----------:|:--------|
|  Node.js: | `>= 20` |

## TypeScript Configuration

Kubb is written in TypeScript and provides full type definitions. You should configure your TypeScript project with `module: "ESNext"` or `module: "NodeNext"` since Kubb prefers ESM.

```json [tsconfig.json]
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2023"]
  }
}
```
## Verify Installation

Check that Kubb is installed correctly:

```bash
npx kubb --version
```

You should see the installed version number displayed.

## Next Steps

<div class="vp-doc">
  <div class="vp-card-container">
    <a href="/getting-started/quick-start" class="vp-card">
      <h3>Quick Start</h3>
      <p>Generate your first code from OpenAPI</p>
    </a>
    <a href="/getting-started/configure" class="vp-card">
      <h3>Configure</h3>
      <p>Set up your configuration file</p>
    </a>
    <a href="/plugins/plugin-oas" class="vp-card">
      <h3>Plugins</h3>
      <p>Explore available plugins</p>
    </a>
  </div>
</div>

