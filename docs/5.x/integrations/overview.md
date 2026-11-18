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

Every integration runs the same `kubb.config.ts`. You pick where Kubb runs.

```mermaid
flowchart LR
  config[kubb.config.ts]:::core
  ai[AI assistants] --> cli
  ai --> mcp
  config --> cli[kubb generate]
  config --> mcp[kubb mcp]
  config --> agent[kubb studio]
  config --> ci[CI snapshot]
  config --> build[Build tools]
  config --> ts[openapi-import]
  agent --> studio[Kubb Studio]
  ci --> studio
```

## Pick an integration

::card-group

:::card{title="Kubb Studio" icon="i-iconoir-cube" to="/docs/5.x/integrations/studio"}
Connect a local project and review generated files in the browser.
:::

:::card{title="CI snapshots" icon="i-iconoir-git-merge" to="/docs/5.x/integrations/ci"}
Publish an installable package per pull request from GitHub Actions, GitLab CI, or any CI.
:::

:::card{title="Build tools" icon="i-iconoir-hammer" to="/docs/5.x/integrations/build-tools"}
Generate when a Vite, webpack, Rollup, Rolldown, Rspack, esbuild, Farm, Nuxt, or Astro build starts.
:::

:::card{title="openapi-import" icon="i-simple-icons-typescript" to="/docs/5.x/integrations/openapi-import"}
Import a `*.openapi.yaml` spec in TypeScript and type-check the plugin output, without generated files.
:::

:::card{title="AI assistants" icon="i-iconoir-sparks" to="/docs/5.x/ai"}
Run Kubb from Claude Code, Cursor, or another assistant through the CLI or the MCP server.
:::

::
