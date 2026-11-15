---
layout: doc
title: Integrate Kubb with Studio, CI, and build tools
description: See where Kubb runs besides the CLI, from Kubb Studio and CI snapshots to build tool plugins, openapi-import, and AI assistants, all from one kubb.config.ts.
outline: [2, 3]
order: 0
navigation:
  title: Overview
  icon: i-iconoir-view-grid
---

# Integrate Kubb with Studio, CI, and build tools

Every integration runs the same `kubb.config.ts`. Pick where generation runs.

```mermaid
flowchart LR
  config[kubb.config.ts]:::core
  ai[AI assistants] --> cli
  config --> cli[kubb generate]
  config --> agent[kubb studio]
  config --> ci[CI snapshot]
  config --> build[Build tools]
  config --> ts[openapi-import]
  agent --> studio[Kubb Studio]
  ci --> studio
```

## Studio

::card-group

:::card{title="Kubb Studio" icon="i-iconoir-cube" to="/docs/5.x/integrations/studio"}
Connect a local project to Studio and review generated files in the browser.
:::

::

## CI

::card-group

:::card{title="CI snapshots" icon="i-iconoir-git-merge" to="/docs/5.x/integrations/ci"}
Publish an installable snapshot per pull request from GitHub Actions, GitLab CI, or any provider.
:::

::

## Build tools {#build-tools}

`unplugin-kubb` runs your `kubb.config.ts` when your build tool starts a build. It ships with `kubb`, so you import it from `kubb/<tool>` and install nothing else.

```mermaid
sequenceDiagram
  participant B as Build tool
  participant U as unplugin-kubb
  participant K as Kubb
  B->>U: build starts
  U->>U: load kubb.config.ts
  U->>K: generate
  K-->>U: files written
  U-->>B: build continues
```

> [!IMPORTANT]
> Vite, Nuxt, and Astro generate during builds only, not in their development servers. Run `kubb generate` before you start a development server.

Every tool follows the same three steps: install Kubb, pass your `kubb.config.ts` as `config`, and run the build. Without `config`, the plugin finds `kubb.config.ts` like the CLI does and builds every config in it that has an `input`.

| Tool | Import | Config file |
| --- | --- | --- |
| [Vite](/docs/5.x/integrations/vite) | `kubb/vite` | `vite.config.ts` |
| [webpack](/docs/5.x/integrations/webpack) | `kubb/webpack` | `webpack.config.ts` |
| [Rspack](/docs/5.x/integrations/rspack) | `kubb/rspack` | `rspack.config.ts` |
| [Rollup](/docs/5.x/integrations/rollup) | `kubb/rollup` | `rollup.config.ts` |
| [Rolldown](/docs/5.x/integrations/rolldown) | `kubb/rolldown` | `rolldown.config.ts` |
| [esbuild](/docs/5.x/integrations/esbuild) | `kubb/esbuild` | `build.ts` |
| [Farm](/docs/5.x/integrations/farm) | `kubb/farm` | `farm.config.ts` |
| [Nuxt](/docs/5.x/integrations/nuxt) | `kubb/nuxt` | `nuxt.config.ts` |
| [Astro](/docs/5.x/integrations/astro) | `kubb/astro` | `astro.config.mjs` |

### How the build runs Kubb

- The plugin applies the same [defaults](/docs/5.x/reference/configuration#defaults) as `defineConfig`. It runs `output.format`, `output.lint`, and `output.postGenerate`.
- It prints the run summary but not the `json`, `file`, or `html` reports. Use `kubb generate` when you need those.
- Watch rebuilds reuse the first output. Restart the build after you change the spec or `kubb.config.ts`.

### Import a spec as a module {#import-a-spec}

Import a `*.openapi.yaml` or `*.openapi.yml` file to get the output of every plugin in your config as one module. Kubb writes no files for the import, and it works in the Vite development server too.

```ts [src/pets.ts]
import { type Pet, petStatusEnum } from './petStore.openapi.yaml'
```

The import uses the config whose `input` is that spec, or else the first config without an `input`. A config without `input` only serves imports. Code a plugin writes to a separate file, such as a bundled client runtime, is not part of the module.

For types in `tsc` and your editor, add [openapi-import](/docs/5.x/integrations/openapi-import).

## TypeScript

::card-group

:::card{title="openapi-import" icon="i-simple-icons-typescript" to="/docs/5.x/integrations/openapi-import"}
Import a `*.openapi.yaml` spec in TypeScript and type-check the output of your plugins, without generated files.
:::

::

## AI assistants

::card-group

:::card{title="AI assistants" icon="i-iconoir-sparks" to="/docs/5.x/ai"}
Run Kubb from Claude Code, Cursor, or another assistant through the CLI or the MCP server.
:::

::
