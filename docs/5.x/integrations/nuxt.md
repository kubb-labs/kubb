---
layout: doc
title: Generate code from your API spec with Nuxt
description: Add the kubb/nuxt module to nuxt.config.ts so every Nuxt build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 13
navigation:
  title: Nuxt
  icon: i-simple-icons-nuxt
---

# Generate code from your API spec with Nuxt

> [!IMPORTANT]
> The module works with the Vite, webpack, and Rspack builders. It generates in the client build, which runs before the server build, and skips `nuxt dev`. Run `kubb generate` before you start the development server.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The Nuxt integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `nuxt.config.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [nuxt.config.ts]
import config from './kubb.config'

export default defineNuxtConfig({
  modules: [['kubb/nuxt', { config }]],
})
```

## Run the build

Run `nuxt build`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
