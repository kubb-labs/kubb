---
layout: doc
title: Generate code from your API spec with Vite
description: Add the kubb/vite plugin to vite.config.ts so every Vite build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 6
navigation:
  title: Vite
  icon: i-simple-icons-vite
---

# Generate code from your API spec with Vite

> [!IMPORTANT]
> Vite generates on `vite build` only, not in the development server. Run `kubb generate` before `vite dev`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The Vite integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `vite.config.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [vite.config.ts]
import kubb from 'kubb/vite'
import { defineConfig } from 'vite'
import config from './kubb.config.ts'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

## Run the build

Run `vite build`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
