---
layout: doc
title: Nuxt module - Generate code from OpenAPI
description: Add the kubb/nuxt module to nuxt.config.ts so every Nuxt build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 13
navigation:
  title: Nuxt
  icon: i-simple-icons-nuxt
---

# Generate code from your API spec with Nuxt

`kubb/nuxt` generates code from your `kubb.config.ts` once, in the client build, which runs before the server build. It ships with `kubb`.

> [!IMPORTANT]
> The module works with the Vite, webpack, and Rspack builders, and skips `nuxt dev`. Run `kubb generate` before you start the dev server.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `nuxt.config.ts`

Pass one config object from your `kubb.config.ts` as `config`, not an array or a function.

```typescript [nuxt.config.ts]
import config from './kubb.config'

export default defineNuxtConfig({
  modules: [['kubb/nuxt', { config }]],
})
```

## Run the build

Run `nuxt build`. If Kubb fails, the build fails.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers defaults, reports, and watch rebuilds.
