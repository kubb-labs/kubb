---
name: config
description: How to author a kubb.config.ts and pick the right @kubb/plugin-* packages when generating TypeScript from an OpenAPI/Swagger spec. Use whenever setting up Kubb, adding a generator, or debugging codegen output.
---

# Kubb config

Kubb turns an OpenAPI/Swagger spec into TypeScript. A project is driven by a single
`kubb.config.ts` at its root. Generation runs through `@kubb/mcp` (the `generate`, `init` and
`validate` tools, exposed by this plugin's MCP server) or the `kubb generate` CLI.

## Shape of a config

```ts
import { defineConfig } from 'kubb'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './petstore.yaml', // local file path or a remote URL
  },
  output: {
    path: './src/gen',
    clean: true, // wipe the output dir before each run
    barrel: { type: 'named' }, // generate index.ts barrels with named exports
  },
  plugins: [pluginOas(), pluginTs(), pluginClient()],
})
```

Rules that matter:

- `pluginOas()` is the foundation. Most generators depend on it, so list it first.
- Each generator plugin takes its own `output.path`, resolved relative to the top-level
  `output.path`. Keep generated kinds in separate folders (`models`, `clients`, `hooks`, ...).
- `input` accepts `{ path }` for a file or URL. Validate untrusted specs first (see the
  `validate` tool) before generating.
- Generation is destructive when `output.clean` is `true`. Never point `output.path` at
  hand-written source.

## Available generator plugins

Pick plugins by what the consumer needs, then install `kubb` plus each package.

| Need | Plugin | Package | Import |
| --- | --- | --- | --- |
| TypeScript types (recommended base) | TypeScript | `@kubb/plugin-ts` | `pluginTs` |
| Fetch/Axios client | Client | `@kubb/plugin-client` | `pluginClient` |
| TanStack React Query hooks | React Query | `@kubb/plugin-react-query` | `pluginReactQuery` |
| Vue Query hooks | Vue Query | `@kubb/plugin-vue-query` | `pluginVueQuery` |
| SWR hooks | SWR | `@kubb/plugin-swr` | `pluginSwr` |
| Zod schemas | Zod | `@kubb/plugin-zod` | `pluginZod` |
| Faker.js mock factories | Faker | `@kubb/plugin-faker` | `pluginFaker` |
| MSW request handlers | MSW | `@kubb/plugin-msw` | `pluginMsw` |
| Cypress fixtures | Cypress | `@kubb/plugin-cypress` | `pluginCypress` |
| MCP server from the spec | MCP | `@kubb/plugin-mcp` | `pluginMcp` |
| ReDoc documentation | ReDoc | `@kubb/plugin-redoc` | `pluginRedoc` |

Common combinations:

- **Types only**: `pluginOas()`, `pluginTs()`.
- **Typed data fetching**: add `pluginClient()`, or a framework plugin
  (`pluginReactQuery` / `pluginVueQuery` / `pluginSwr`) which pulls in client generation.
- **Runtime validation**: add `pluginZod()` and point the client at it for typed, validated
  responses.
- **Testing/mocks**: add `pluginFaker()` and `pluginMsw()`.

## Workflow

1. **Validate the spec** with the `validate` tool before anything else.
2. **Scaffold** `kubb.config.ts` with the `init` tool (or write it by hand using the shape
   above). `init` does not install packages.
3. **Install** `kubb` and the chosen `@kubb/plugin-*` packages as dev dependencies.
4. **Generate** with the `generate` tool (or `npx kubb generate`). Pass `logLevel: 'verbose'`
   when diagnosing why a file is missing or malformed.
5. **Typecheck** the generated output and wire it into the app.

See the `setup`, `generate` and `validate` commands for the step-by-step flows.
