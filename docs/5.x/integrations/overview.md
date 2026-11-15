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

## Build tools

::card-group

:::card{title="Build tools" icon="i-iconoir-tools" to="/docs/5.x/integrations/build-tools"}
Generate during a Vite, webpack, Rspack, Rollup, Rolldown, esbuild, Farm, Nuxt, or Astro build, or import a spec as a module.
:::

::

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
