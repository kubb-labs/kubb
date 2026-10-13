---
layout: doc
title: Build tools
description: Run Kubb during a Vite, webpack, Rollup, Rolldown, Rspack, esbuild, Farm, Nuxt, or Astro build.
outline: [2, 3]
order: 5
navigation:
  title: Build tools
  icon: i-iconoir-tools
---

# Build tools

Kubb runs generation during your build through `unplugin-kubb`, included with `kubb`. Each integration takes your shared `kubb.config.ts` as a single `config` object and generates when the tool builds.

## Supported bundlers

| Bundler | Import | Guide |
| --- | --- | --- |
| Vite | `kubb/vite` | [Generate with Vite](/docs/5.x/integrations/vite) |
| webpack | `kubb/webpack` | [Generate with webpack](/docs/5.x/integrations/webpack) |
| Rollup | `kubb/rollup` | [Generate with Rollup](/docs/5.x/integrations/rollup) |
| Rolldown | `kubb/rolldown` | [Generate with Rolldown](/docs/5.x/integrations/rolldown) |
| Rspack | `kubb/rspack` | [Generate with Rspack](/docs/5.x/integrations/rspack) |
| esbuild | `kubb/esbuild` | [Generate with esbuild](/docs/5.x/integrations/esbuild) |
| Farm | `kubb/farm` | [Generate with Farm](/docs/5.x/integrations/farm) |
| Nuxt | `kubb/nuxt` | [Generate with Nuxt](/docs/5.x/integrations/nuxt) |
| Astro | `kubb/astro` | [Generate with Astro](/docs/5.x/integrations/astro) |

Vite, Nuxt, and Astro generate during builds only. Run `kubb generate` before starting their development servers.

> [!NOTE]
> Bundler integrations apply fewer defaults than the CLI: no Markdown parser, no reporters, and no `output.postGenerate` commands. See [Defaults](/docs/5.x/reference/configuration#defaults).
