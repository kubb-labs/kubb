---
layout: doc
title: "Introduction to Kubb: turn your API spec into code"
description: Kubb generates TypeScript types, Axios and Fetch clients, TanStack Query hooks, Zod schemas, and MSW mocks from your API spec. Regenerate to keep them in sync.
outline:
  - 2
  - 3
order: 0
navigation:
  title: Introduction
  icon: i-iconoir-info-circle
---

# Introduction to Kubb: turn your API spec into code

Kubb generates code from API specifications: TypeScript types, API clients, query hooks, validators, and mocks. Regenerate when your specification changes to keep these files in sync with your API, then import them in your application.

Choose the outputs you need with plugins in one `kubb.config.ts` file. Generated files belong to your project. The default [OpenAPI adapter](/extensions/kubb-labs/adapter-oas) supports OpenAPI 2.0, 3.0, and 3.1.

## Features

- Generate [TypeScript types](/extensions/kubb-labs/plugin-ts), typed [Axios](/extensions/kubb-labs/plugin-axios) or [Fetch](/extensions/kubb-labs/plugin-fetch) clients, [React Query](/extensions/kubb-labs/plugin-react-query), [Vue Query](/extensions/kubb-labs/plugin-vue-query), and [SWR](/extensions/kubb-labs/plugin-swr) hooks.
- Validate data with [Zod](/extensions/kubb-labs/plugin-zod), create [Faker](/extensions/kubb-labs/plugin-faker) data and [MSW](/extensions/kubb-labs/plugin-msw) handlers, generate [Cypress](/extensions/kubb-labs/plugin-cypress) tests, or expose your API through a generated [MCP server](/extensions/kubb-labs/plugin-mcp).
- Customize the pipeline with adapters, plugins, parsers, macros, and resolvers, or write output to disk, memory, or a custom storage backend.
- Run generation with [Vite and webpack](/docs/5.x/integrations/overview#build-tools), other bundlers, or in CI. Connect AI tools through [MCP](/docs/5.x/ai/mcp) or use the [Claude Code integration](/docs/5.x/ai/claude).

## See it work

The animation below follows a spec through Kubb's generation pipeline. The adapter turns schemas and operations into AST nodes, then plugins generate files from those nodes.

```typescript twoslash [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen' },
  plugins: [pluginTs(), pluginZod()],
})
```

::spec-journey
::

See the [architecture guide](/docs/5.x/explanation/architecture) for details about each stage.

## Start here

| You want to | Read |
| --- | --- |
| Install Kubb in a project | [Installation](/docs/5.x/how-to/installation) |
| Generate your first client | [Generate your first client](/docs/5.x/tutorials/quickstart) |
| Configure a stack or workflow | [Configure generation](/docs/5.x/how-to/recipes) |
| Rename files or customize generated code | [Resolvers](/docs/5.x/how-to/resolvers), [macros](/docs/5.x/how-to/macros), and [printers](/docs/5.x/how-to/printers) |
| Run generation during a build or in CI | [Build tools](/docs/5.x/integrations/overview#build-tools) and [CI](/docs/5.x/integrations/ci) |
| Use Kubb with a browser or AI assistant | [Studio](/docs/5.x/integrations/studio) and [AI assistants](/docs/5.x/ai) |
| Build a plugin | [Plugin tutorial](/docs/5.x/tutorials/creating-plugins) |
| Look up an option or API | [Configuration](/docs/5.x/reference/configuration), [commands](/docs/5.x/reference/commands/), and [Kit API](/docs/5.x/reference/kit) |
| Understand the pipeline | [Architecture](/docs/5.x/explanation/architecture) |
| Upgrade from v4 | [Migration guide](/docs/5.x/how-to/migration) |

## Community

Kubb is free and open source under the MIT license. Get help on [Discord](https://discord.gg/shfBFeczrm), report an issue on [GitHub](https://github.com/kubb-labs/kubb/issues), or read [Contributing](/docs/5.x/community/contributing).
