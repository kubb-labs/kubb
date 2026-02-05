---
layout: doc

title: Install Kubb OpenAPI Code Generator - Setup Guide
description: Install Kubb in your TypeScript project. Quick interactive setup with npx kubb init or manual installation guide for all package managers.
outline: deep
---

# Install Kubb OpenAPI Code Generator

Install Kubb to start generating type-safe TypeScript code from your OpenAPI/Swagger specifications. Choose between automatic interactive setup or manual installation.

## Why Install Kubb?

Kubb transforms OpenAPI specifications into production-ready TypeScript code including:
- Type-safe API clients
- React Query/SWR/TanStack Query hooks
- Zod validation schemas
- MSW mock handlers
- And more through plugins

**Who should install Kubb?** Frontend developers using TypeScript with OpenAPI-documented REST APIs.

## Quick Install (Recommended)

**The fastest way to install and configure Kubb** is using the interactive `init` command:

```bash
npx kubb init
```

This single command handles the entire setup:
- Detects or creates your `package.json`
- Prompts for your OpenAPI/Swagger specification path
- Asks which plugins you want to install
- Automatically installs all necessary npm packages
- Generates a configured `kubb.config.ts` file

**Why use `kubb init`?**
- Zero configuration required
- Avoids version mismatch errors
- Sets up recommended defaults
- Takes less than 60 seconds

> [!TIP]
> The `kubb init` command is the recommended installation method. Skip manual steps and let Kubb set everything up correctly.

## Manual Installation

If you prefer manual control over package installation:

### Install Core Packages

Install the Kubb CLI and core library as development dependencies:

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

## Install Kubb Plugins

Kubb uses plugins to generate different code artifacts. Install only the plugins you need for your project.

### TypeScript Types Plugin

Generate TypeScript interfaces and types from your OpenAPI schemas:

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

### HTTP Client Plugin

Generate type-safe HTTP client code with Axios, Fetch, or custom implementations:

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

### Data Fetching Library Plugins

Generate hooks for React Query, SWR, Vue Query, Solid Query, or Svelte Query:

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

### Validation & Mocking Plugins

Install plugins for runtime validation and mock data generation:

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

**Node.js version:** Kubb requires Node.js 20 or higher.

|           |         |
|----------:|:--------|
|  Node.js: | `>= 20` |

**Why Node.js 20?**
Kubb uses modern JavaScript features available in Node.js 20+. Earlier versions are not supported.

**Check your Node.js version:**
```bash
node --version
```

**Upgrade Node.js** (if needed):
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20
```

## TypeScript Configuration

**Kubb is written in TypeScript and provides full type definitions.** Configure your TypeScript project for compatibility with Kubb's ESM modules.

**Recommended `tsconfig.json` settings:**

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

**Why these settings?**
- `"module": "ESNext"` - Kubb uses ESM modules
- `"moduleResolution": "bundler"` - Modern module resolution for bundlers
- `"target": "ES2022"` - Modern JavaScript target for Node.js 20+
## Verify Installation

Confirm Kubb is installed correctly by checking the version:

```bash
npx kubb --version
```

**Expected output:** Version number (e.g., `3.0.0`)

If you see an error, check that:
- Node.js version is 20 or higher (`node --version`)
- Kubb packages are installed (`npm list @kubb/cli`)
- You're in the correct project directory

## Next Steps

<div class="vp-doc">
  <div class="vp-card-container">
    <a href="/getting-started/quick-start" class="vp-card">
      <h3>Quick Start Guide</h3>
      <p>Generate your first code from an OpenAPI specification</p>
    </a>
    <a href="/getting-started/configure" class="vp-card">
      <h3>Configuration</h3>
      <p>Learn how to configure Kubb for your project</p>
    </a>
    <a href="/plugins/plugin-oas" class="vp-card">
      <h3>Explore Plugins</h3>
      <p>View available plugins and their features</p>
    </a>
  </div>
</div>

## Frequently Asked Questions

**Q: Can I use Kubb with Yarn/Bun instead of npm?**
Yes, Kubb works with all package managers (npm, pnpm, yarn, bun). Use your preferred package manager for installation.

**Q: Do I need to install all plugins?**
No, install only the plugins you need. For example, if you only need TypeScript types, install `@kubb/plugin-ts` only.

**Q: Can I install Kubb globally?**
While possible, we recommend installing Kubb as a dev dependency in each project to ensure version consistency.

**Q: What if I get peer dependency warnings?**
Peer dependency warnings are usually safe to ignore. Kubb will work correctly as long as core packages are installed.

**Q: How do I update Kubb?**
Run your package manager's update command (e.g., `npm update @kubb/cli @kubb/core`) to get the latest version.

