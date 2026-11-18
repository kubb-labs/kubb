---
layout: doc
title: Build tool plugins - Generate code during a build
description: Run your kubb.config.ts from Vite, webpack, Rollup, Rolldown, Rspack, esbuild, Farm, Nuxt, or Astro with unplugin-kubb, so every build generates code from your API spec.
outline: [2, 3]
order: 5
navigation:
  title: Build tools
  icon: i-iconoir-hammer
---

# Build tool plugins

`unplugin-kubb` runs your `kubb.config.ts` when a build starts. It ships with `kubb`, and you import it from `kubb/<tool>`.

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
> Vite, Nuxt, and Astro generate during builds only, not in their dev servers. Run `kubb generate` before you start a dev server.

Each tool page passes your `kubb.config.ts` as `config`. Without `config`, the plugin finds `kubb.config.ts` like the CLI does and builds every config in it that has an `input`.

| Tool | Import | Config file |
| --- | --- | --- |
| [Vite](/docs/5.x/integrations/build-tools/vite) | `kubb/vite` | `vite.config.ts` |
| [webpack](/docs/5.x/integrations/build-tools/webpack) | `kubb/webpack` | `webpack.config.ts` |
| [Rspack](/docs/5.x/integrations/build-tools/rspack) | `kubb/rspack` | `rspack.config.ts` |
| [Rollup](/docs/5.x/integrations/build-tools/rollup) | `kubb/rollup` | `rollup.config.ts` |
| [Rolldown](/docs/5.x/integrations/build-tools/rolldown) | `kubb/rolldown` | `rolldown.config.ts` |
| [esbuild](/docs/5.x/integrations/build-tools/esbuild) | `kubb/esbuild` | `build.ts` |
| [Farm](/docs/5.x/integrations/build-tools/farm) | `kubb/farm` | `farm.config.ts` |
| [Nuxt](/docs/5.x/integrations/build-tools/nuxt) | `kubb/nuxt` | `nuxt.config.ts` |
| [Astro](/docs/5.x/integrations/build-tools/astro) | `kubb/astro` | `astro.config.mjs` |

## How the build runs Kubb

- The plugin applies the same [defaults](/docs/5.x/reference/configuration#defaults) as `defineConfig` and runs `output.format`, `output.lint`, and `output.postGenerate`.
- It prints the run summary, not the `json`, `file`, or `html` reports. Use `kubb generate` for those.
- Watch rebuilds reuse the first output. Restart the build after you change the spec or `kubb.config.ts`.

## Import a spec as a module {#import-a-spec}

Import a config's `input` file, or any `*.openapi.yaml` or `*.openapi.yml` file, to get the output of every plugin in your config as one module. Kubb writes no files for it, and it works in the Vite dev server too.

```ts [src/pets.ts]
import { type Pet, petStatusEnum } from './petStore.openapi.yaml'
```

- The import uses the config whose `input` is that spec, or else the first config without an `input`. A config without `input` only serves imports.
- Code a plugin writes to a separate file, such as a bundled client runtime, is not part of the module.
- The `input` file loads whatever its name, so `./my-api.openapi.json` works when it is a config's `input`. openapi-import gives no types for a `.json` import, because TypeScript does not let a content mapper register a `.json` extension.

For types in `tsc` and your editor, add [openapi-import](/docs/5.x/integrations/openapi-import).
