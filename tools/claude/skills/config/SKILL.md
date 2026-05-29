---
name: config
description: How to author a kubb.config.ts and pick the right @kubb/plugin-* packages when generating TypeScript from an OpenAPI/Swagger spec. Use whenever setting up Kubb, adding a generator, or debugging codegen output.
---

# Config Skill

This skill instructs agents on authoring a `kubb.config.ts` and picking the right
`@kubb/plugin-*` packages. Generation runs through the `kubb` CLI (`kubb generate`), and the same
build powers the bundled MCP server.

## When to Use

- Setting up Kubb in a project
- Adding or swapping a generator plugin
- Debugging why generated output is missing or wrong

## What It Does

- Shows the shape of a `kubb.config.ts`
- Lists the generator plugins and how to combine them
- Points at each plugin's `extension.yaml` for authoritative options
- Describes the validate, init and generate workflow

## Shape of a config

```ts
import { defineConfig } from 'kubb'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  root: '.',
  input: {
    path: './petstore.yaml', // local file path or a remote URL
  },
  output: {
    path: './src/gen',
    clean: true, // wipe the output dir before each run
    barrel: { type: 'named' }, // generate index.ts barrels with named exports
  },
  plugins: [
    pluginTs({ output: { path: 'models' } }),
    pluginClient({ output: { path: 'clients' } }),
  ],
})
```

Rules that matter:

- Set adapter options only when you need them, through a top-level
  `adapter: adapterOas({ ... })` from `@kubb/adapter-oas` (for `validate`, `serverIndex`,
  `serverVariables`, `discriminator` or `contentType`).
- `pluginTs` is the base. `pluginClient` needs it, the framework plugins (`pluginReactQuery`,
  `pluginVueQuery`, `pluginSwr`) need `pluginTs` and `pluginClient`, and `pluginMsw` needs
  `pluginTs` and `pluginFaker`. Check a plugin's `extension.yaml` `dependencies` for the full list.
- Each generator plugin takes its own `output.path`, resolved relative to the top-level
  `output.path`. Keep generated kinds in separate folders (`models`, `clients`, `hooks`, ...).
- `input` accepts `{ path }` for a file or URL. Validate untrusted specs with `kubb validate`
  before generating.
- Generation is destructive when `output.clean` is `true`. Never point `output.path` at
  hand-written source.
- Set `output.format` or `output.lint` to `'auto'` to format and lint generated files with
  whatever tool the project already has (oxfmt, Biome, Prettier, oxlint or ESLint).

## Available generator plugins

Pick plugins by what the consumer needs, then install `kubb` plus each package.

| Need | Package | Import |
| --- | --- | --- |
| TypeScript types (recommended base) | `@kubb/plugin-ts` | `pluginTs` |
| Fetch/Axios client | `@kubb/plugin-client` | `pluginClient` |
| TanStack React Query hooks | `@kubb/plugin-react-query` | `pluginReactQuery` |
| Vue Query hooks | `@kubb/plugin-vue-query` | `pluginVueQuery` |
| SWR hooks | `@kubb/plugin-swr` | `pluginSwr` |
| Zod schemas | `@kubb/plugin-zod` | `pluginZod` |
| Faker.js mock factories | `@kubb/plugin-faker` | `pluginFaker` |
| MSW request handlers | `@kubb/plugin-msw` | `pluginMsw` |
| Cypress fixtures | `@kubb/plugin-cypress` | `pluginCypress` |
| MCP server from the spec | `@kubb/plugin-mcp` | `pluginMcp` |
| ReDoc documentation | `@kubb/plugin-redoc` | `pluginRedoc` |

For an installed plugin's exact options, read its `extension.yaml`
(`node_modules/@kubb/plugin-<name>/extension.yaml`). It ships with the package and lists the
`options` schema with defaults, the plugin `dependencies`, and the default `output.path`. Use it as
the source of truth instead of guessing an option name.

Common combinations:

- Types only: `pluginTs()`.
- Typed data fetching: add `pluginClient()`, or a framework plugin (`pluginReactQuery`,
  `pluginVueQuery` or `pluginSwr`) which pulls in client generation.
- Runtime validation: add `pluginZod()` and point the client at it for typed, validated responses.
- Testing and mocks: add `pluginFaker()` and `pluginMsw()`.

## Workflow

The commands wrap the `kubb` CLI, so the same steps work from a terminal.

1. Validate the spec with `kubb validate --input <spec>` before anything else.
2. Scaffold and install with `kubb init`. Pass `--input`, `--output` and `--plugins` to skip the
   prompts, or write `kubb.config.ts` by hand using the shape above.
3. Generate with `kubb generate`. Pass `--verbose` when diagnosing why a file is missing or
   malformed, and `--watch` to regenerate on spec changes.
4. Typecheck the generated output and wire it into the app.

## Related Skills

| Skill | Use For |
| --- | --- |
| **[../output/SKILL.md](../output/SKILL.md)** | Importing and using the generated code |
