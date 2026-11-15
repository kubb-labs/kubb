---
layout: doc
title: Generate code from your API spec with Astro
description: Add the kubb/astro integration to astro.config.mjs so every Astro build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 14
navigation:
  title: Astro
  icon: i-simple-icons-astro
---

# Generate code from your API spec with Astro

> [!IMPORTANT]
> The integration adds the Vite plugin to Astro, so it generates on `astro build` only. Run `kubb generate` before `astro dev`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The Astro integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `astro.config.mjs`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [astro.config.mjs]
import { defineConfig } from 'astro/config'
import kubb from 'kubb/astro'
import config from './kubb.config'

export default defineConfig({
  integrations: [kubb({ config })],
})
```

## Run the build

Run `astro build`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
