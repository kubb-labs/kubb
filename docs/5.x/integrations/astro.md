---
layout: doc
title: Astro integration - Generate code from OpenAPI
description: Add the kubb/astro integration to astro.config.mjs so every Astro build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 14
navigation:
  title: Astro
  icon: i-simple-icons-astro
---

# Generate code from your API spec with Astro

`kubb/astro` ships with `kubb`. It generates code from your `kubb.config.ts` once, before `astro build` continues.

> [!IMPORTANT]
> The integration adds the Vite plugin to Astro, so it generates on `astro build` only. Run `kubb generate` before `astro dev`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `astro.config.mjs`

Pass your `kubb.config.ts` as `config`. It takes one config object, not an array or a function.

```typescript [astro.config.mjs]
import { defineConfig } from 'astro/config'
import kubb from 'kubb/astro'
import config from './kubb.config'

export default defineConfig({
  integrations: [kubb({ config })],
})
```

## Run the build

Run `astro build`. A failed generation fails the build.

::

See [How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) for defaults, reports, and watch rebuilds.
