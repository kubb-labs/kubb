---
layout: doc
title: Configure generation - Common Kubb recipes
description: Configure common Kubb stacks, formatting, linting, post-generate commands, barrel files, git inputs, watch mode, and several specs in one run.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Configure generation
  icon: i-iconoir-flask
---

# Configure generation

Each recipe is a complete `kubb.config.ts` for a project with [Kubb installed](/docs/5.x/how-to/installation). Replace `./petStore.yaml` with your spec, install the listed packages, and run `npx kubb generate`.

> [!WARNING]
> The examples write to `./src/gen`. With `clean: true`, Kubb removes that directory before generation, so keep handwritten files elsewhere.

## Pick a stack

::tabs

:::tabs-item{label="React Query"}

Types, an Axios client, and [TanStack Query](https://tanstack.com/query) hooks for React.

```shell [Terminal]
npm install -D kubb typescript @kubb/plugin-ts @kubb/plugin-axios @kubb/plugin-react-query
npm install axios react @tanstack/react-query
```

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginReactQuery } from '@kubb/plugin-react-query'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', clean: true },
  plugins: [pluginTs(), pluginAxios(), pluginReactQuery({ hooks: true })],
})
```

:::

:::tabs-item{label="Vue Query"}

Types, an Axios client, and [TanStack Query](https://tanstack.com/query) composables for Vue.

```shell [Terminal]
npm install -D kubb typescript @kubb/plugin-ts @kubb/plugin-axios @kubb/plugin-vue-query
npm install axios vue @tanstack/vue-query
```

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginVueQuery } from '@kubb/plugin-vue-query'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', clean: true },
  plugins: [pluginTs(), pluginAxios(), pluginVueQuery({ hooks: true })],
})
```

:::

:::tabs-item{label="Zod and MSW"}

Runtime validation with [Zod](https://zod.dev), plus [MSW](https://mswjs.io) request handlers backed by [Faker.js](https://fakerjs.dev) mock data.

```shell [Terminal]
npm install -D kubb typescript @kubb/plugin-ts @kubb/plugin-zod @kubb/plugin-faker @kubb/plugin-msw
npm install zod msw @faker-js/faker
```

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', clean: true },
  plugins: [pluginTs(), pluginZod(), pluginFaker(), pluginMsw({ parser: 'faker', handlers: true })],
})
```

:::

::

To use the global `fetch` instead of Axios, replace `pluginAxios` with [`pluginFetch`](/extensions/kubb-labs/plugin-fetch) from `@kubb/plugin-fetch`.

## Format, lint, and run commands after generation

- `format` and `lint` take a tool name, or `'auto'` for the first one installed. Install the tools first, such as `npm install -D @biomejs/biome oxlint`.
- [`output.postGenerate`](/docs/5.x/reference/configuration#outputpostgenerate) runs shell commands after formatting and linting. The example runs a `typecheck` script, such as `"typecheck": "tsc --noEmit"` in `package.json`.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: {
    path: './src/gen',
    clean: true,
    format: 'biome',
    lint: 'oxlint',
    postGenerate: ['npm run typecheck'],
  },
  plugins: [pluginTs()],
})
```

## Add barrel files {#barrel-files}

A barrel is an `index.ts` that re-exports a folder. `defineConfig` registers [`@kubb/plugin-barrel`](/extensions/kubb-labs/plugin-barrel) for you, with these defaults:

| Barrel | Default | Change it with |
| --- | --- | --- |
| Root, such as `src/gen/index.ts` | Off | `output.barrel` on `defineConfig` |
| Plugin folder, such as `src/gen/types/index.ts` | `{ type: 'named' }` from the plugin's default `output` | `barrel` inside the plugin's `output`, or `false` to drop it |

This config turns on the root barrel, writes `export *` barrels in every TypeScript subfolder, and leaves the Zod files out of all barrels:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  plugins: [
    pluginTs({ output: { path: 'types', barrel: { type: 'all', nested: true } } }),
    pluginZod({ output: { path: 'zod', barrel: false } }),
  ],
})
```

> [!IMPORTANT]
> Your own `output` on a plugin replaces its default, barrel included. Set `barrel` in it, or the plugin falls back to the root `output.barrel`. A plugin writes a barrel only in directory mode, which an `output.path` without a file extension implies.

[`output.barrel`](/docs/5.x/reference/plugin-options#output-barrel) shows each export style and the `nested` and `namespace` fields.

## Read the spec from a git repository

When the spec lives in another repository, set `input` to `git+<repo>#<ref>:<path>`. Pin `<ref>` to a tag or commit so every run uses the same spec:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: 'git+https://github.com/org/api.git#v2.1.0:specs/openapi.yaml',
  output: { path: './src/gen' },
  plugins: [pluginTs()],
})
```

Kubb runs `git` from the `PATH` with your credentials, so a private repository works with your credential helper or SSH key. In CI, give the job read access to that repository. [`input`](/docs/5.x/reference/configuration#input) has the full format.

## Watch mode, several specifications, and scripts

| To | Do this |
| --- | --- |
| Regenerate when the local spec changes | Run `kubb generate --watch`. A URL or git input generates once. See [Watch mode](/docs/5.x/topics/cli-runs#watch-mode). |
| Generate from several specs in one run | Pass an array to `defineConfig`, each entry with its own plugins and output directory. Set a `name` per entry to tell them apart in the CLI output. |
| Drive Kubb from a script | Call [`createKubb`](/docs/5.x/reference/kit/engine#createkubb) to orchestrate builds or inspect diagnostics. |
| Fail CI on an invalid spec | Run [`kubb validate`](/docs/5.x/reference/commands/validate) before generation. |
