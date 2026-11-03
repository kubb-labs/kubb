---
layout: doc
title: Configure generation
description: Configure common Kubb stacks, formatting, linting, and post-generate commands.
outline:
  - 2
  - 3
order: 2
navigation:
  title: Configure generation
  icon: i-iconoir-flask
---

# Configure generation

Use these configurations in a project with [Kubb installed](/docs/5.x/how-to/installation) and an OpenAPI specification. Replace `./petStore.yaml` with your specification path, install the packages for your stack, then run `npx kubb generate`. Each plugin page shows its single-plugin configuration. The stacks below combine several plugins.

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

To call the API with the global `fetch` instead of Axios, replace `pluginAxios` with [`pluginFetch`](/extensions/kubb-labs/plugin-fetch) from `@kubb/plugin-fetch`.

## Format, lint, and run commands after generation

Set `format` and `lint` to a tool name, or to `'auto'` to pick whichever tool is installed. [`output.postGenerate`](/docs/5.x/reference/configuration#outputpostgenerate) runs shell commands once the files are formatted and linted. Install the tools first, for example `npm install -D @biomejs/biome oxlint`.

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

## Read the spec from a git repository

Point `input` at a file in a git repository when the spec lives in another repo, such as the API's own. Write it as `git+<repo>#<ref>:<path>`, and pin `<ref>` to a tag or commit so every run generates from the same spec:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'

export default defineConfig({
  input: 'git+https://github.com/org/api.git#v2.1.0:specs/openapi.yaml',
  output: { path: './src/gen' },
})
```

Kubb needs `git` on the `PATH` and uses your own git credentials, so a private repository works with the credential helper or SSH key you already use. In CI, give the job read access to that repository. See [`input`](/docs/5.x/reference/configuration#input) for the full format.

## Watch mode, several specifications, and scripts

- Run `kubb generate --watch` to regenerate when the local spec file changes. A URL or git input is generated once, so rerun Kubb after the remote spec changes. Pass a function to `defineConfig` to read `watch` and keep `clean` off during incremental runs. See [Config formats](/docs/5.x/reference/configuration#config-formats).
- Pass an array to `defineConfig` to generate from several specifications in one run, each with its own plugins and output directory. Set a `name` per entry so the CLI output tells them apart.
- Drive Kubb from a script with [`createKubb`](/docs/5.x/reference/kit/engine#createkubb) when you orchestrate builds or inspect diagnostics.
- Run [`kubb validate`](/docs/5.x/reference/commands/validate) before generation in CI to fail on an invalid specification.
