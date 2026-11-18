---
layout: doc
title: Introduction - OpenAPI to TypeScript code generator
description: Generate TypeScript types, Axios and Fetch clients, TanStack Query hooks, Zod schemas, and Faker and MSW mocks from an OpenAPI spec with Kubb.
outline:
  - 2
  - 3
order: 0
navigation:
  title: Introduction
  icon: i-iconoir-info-circle
---

# Introduction to Kubb: turn your API spec into code

Kubb turns an API spec into the code your app uses to call that API: types, clients, query hooks, validators, and mocks. You pick the outputs with plugins in one `kubb.config.ts`. When the spec changes, run Kubb again and the code follows.

Generate [TypeScript types](/extensions/kubb-labs/plugin-ts), [Axios](/extensions/kubb-labs/plugin-axios) and [Fetch](/extensions/kubb-labs/plugin-fetch) clients, [TanStack Query hooks](/extensions/kubb-labs/plugin-react-query), [Zod schemas](/extensions/kubb-labs/plugin-zod), and [Faker](/extensions/kubb-labs/plugin-faker) and [MSW](/extensions/kubb-labs/plugin-msw) mocks from an [OpenAPI spec](/extensions/kubb-labs/adapter-oas) with Kubb.

## What Kubb generates

| Output | Plugins |
| --- | --- |
| TypeScript types | [`plugin-ts`](/extensions/kubb-labs/plugin-ts) |
| HTTP clients | [`plugin-axios`](/extensions/kubb-labs/plugin-axios), [`plugin-fetch`](/extensions/kubb-labs/plugin-fetch) |
| Query hooks | [`plugin-react-query`](/extensions/kubb-labs/plugin-react-query), [`plugin-vue-query`](/extensions/kubb-labs/plugin-vue-query), [`plugin-swr`](/extensions/kubb-labs/plugin-swr) |
| Validation schemas | [`plugin-zod`](/extensions/kubb-labs/plugin-zod) |
| Mock data, request handlers, and tests | [`plugin-faker`](/extensions/kubb-labs/plugin-faker), [`plugin-msw`](/extensions/kubb-labs/plugin-msw), [`plugin-cypress`](/extensions/kubb-labs/plugin-cypress) |
| An MCP server for your API | [`plugin-mcp`](/extensions/kubb-labs/plugin-mcp) |
| API documentation | [`plugin-redoc`](/extensions/kubb-labs/plugin-redoc) |

The default [OpenAPI adapter](/extensions/kubb-labs/adapter-oas) reads OpenAPI 2.0, 3.0, 3.1, and 3.2.

## See it work

This config generates types and Zod schemas from `petStore.yaml`:

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginTs(), pluginZod()],
})
```

The adapter turns the spec into AST nodes, and each plugin generates files from those nodes. [Architecture](/docs/5.x/introduction/architecture) explains each stage.

::spec-journey
::

## Start here

| You want to | Read |
| --- | --- |
| Learn by generating a client from a sample spec | [Generate your first client](/docs/5.x/tutorials/quickstart) |
| Add Kubb to your project | [Installation](/docs/5.x/how-to/installation) |
| Set up a stack, such as React Query with Zod | [Configure generation](/docs/5.x/how-to/recipes) |
| Rename files or change generated code | [Resolvers](/docs/5.x/how-to/customize#resolvers), [macros](/docs/5.x/how-to/customize#macros), and [printers](/docs/5.x/how-to/customize#printers) |
| Generate during a build or in CI | [Build tools](/docs/5.x/integrations/build-tools) and [CI](/docs/5.x/integrations/ci) |
| Use Kubb from a browser or an AI assistant | [Studio](/docs/5.x/integrations/studio) and [AI assistants](/docs/5.x/ai) |
| Build a plugin | [Create a plugin](/docs/5.x/tutorials/creating-plugins) |
| Look up an option, command, or API | [Configuration](/docs/5.x/reference/configuration), [commands](/docs/5.x/reference/commands/), and [Kit API](/docs/5.x/reference/kit) |
| Understand the pipeline | [Architecture](/docs/5.x/introduction/architecture) |
| Compare Kubb with other generators | [Comparison](/docs/5.x/introduction/comparison) |
| Switch from another generator | Move from [orval](/docs/5.x/migrate/from-orval), [HeyAPI](/docs/5.x/migrate/from-hey-api), or [openapi-typescript](/docs/5.x/migrate/from-openapi-typescript) |
| Upgrade from v4 | [Migration guide](/docs/5.x/migrate/from-v4) |

## Community

Kubb is free and open source under the MIT license. Ask on [Discord](https://discord.gg/shfBFeczrm), report bugs on [GitHub](https://github.com/kubb-labs/kubb/issues), or read the [FAQ](/docs/5.x/community/faq).
