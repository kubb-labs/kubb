---
layout: doc
title: Vite plugin - Generate code from OpenAPI
description: Add the kubb/vite plugin to vite.config.ts so every Vite build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 6
navigation:
  title: Vite
  icon: i-simple-icons-vite
---

# Generate code from your API spec with Vite

`kubb/vite` ships with `kubb`. It generates code from your `kubb.config.ts` once, before `vite build` continues.

> [!IMPORTANT]
> Vite generates on `vite build` only, not in the development server. Run `kubb generate` before `vite dev`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `vite.config.ts`

Pass your `kubb.config.ts` as `config`. It takes one config object, not an array or a function.

```typescript [vite.config.ts]
import kubb from 'kubb/vite'
import { defineConfig } from 'vite'
import config from './kubb.config.ts'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

## Run the build

Run `vite build`. A failed generation fails the build.

::

See [How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) for defaults, reports, and watch rebuilds.
