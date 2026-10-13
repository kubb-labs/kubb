---
layout: doc
title: Integrations overview
description: Connect Kubb to Studio, publish snapshots from CI, or run generation during a Vite, webpack, Rollup, Rolldown, Rspack, esbuild, Farm, Nuxt, or Astro build.
outline: [2, 3]
order: 0
navigation:
  title: Overview
  icon: i-iconoir-view-grid
---

# Integrations overview

Run Kubb from Studio, from CI, or during your build. Each integration uses your shared `kubb.config.ts`.

## Studio

::card-group

:::card{title="Kubb Studio" icon="i-iconoir-cube" to="/docs/5.x/integrations/studio"}
Connect a local project to Studio and review generated files in the browser.
:::

::

## CI

::card-group

:::card{title="CI snapshots" icon="i-iconoir-git-merge" to="/docs/5.x/integrations/ci"}
Publish installable Studio snapshots from any CI provider.
:::

:::card{title="GitHub Actions" icon="i-simple-icons-githubactions" to="/docs/5.x/integrations/github-actions"}
Publish snapshots from GitHub Actions and review generated-file changes.
:::

:::card{title="GitLab CI" icon="i-simple-icons-gitlab" to="/docs/5.x/integrations/gitlab"}
Publish snapshots from GitLab CI and review generated-file changes.
:::

::

## Build tools

Kubb runs generation during your build through `unplugin-kubb`, included with `kubb`. Each integration takes your `kubb.config.ts` as a single `config` object and generates when the tool builds.

::card-group

:::card{title="Vite" icon="i-simple-icons-vite" to="/docs/5.x/integrations/vite"}
Import from `kubb/vite`.
:::

:::card{title="webpack" icon="i-simple-icons-webpack" to="/docs/5.x/integrations/webpack"}
Import from `kubb/webpack`.
:::

:::card{title="Rollup" icon="i-simple-icons-rollupdotjs" to="/docs/5.x/integrations/rollup"}
Import from `kubb/rollup`.
:::

:::card{title="Rolldown" icon="i-simple-icons-rolldown" to="/docs/5.x/integrations/rolldown"}
Import from `kubb/rolldown`.
:::

:::card{title="Rspack" icon="i-iconoir-journal" to="/docs/5.x/integrations/rspack"}
Import from `kubb/rspack`.
:::

:::card{title="esbuild" icon="i-simple-icons-esbuild" to="/docs/5.x/integrations/esbuild"}
Import from `kubb/esbuild`.
:::

:::card{title="Farm" icon="i-iconoir-light-bulb" to="/docs/5.x/integrations/farm"}
Import from `kubb/farm`.
:::

:::card{title="Nuxt" icon="i-simple-icons-nuxt" to="/docs/5.x/integrations/nuxt"}
Import from `kubb/nuxt`.
:::

:::card{title="Astro" icon="i-simple-icons-astro" to="/docs/5.x/integrations/astro"}
Import from `kubb/astro`.
:::

::

Vite, Nuxt, and Astro generate during builds only. Run `kubb generate` before starting their development servers.

> [!NOTE]
> Bundler integrations apply fewer defaults than the CLI: no Markdown parser, no reporters, and no `output.postGenerate` commands. See [Defaults](/docs/5.x/reference/configuration#defaults).
