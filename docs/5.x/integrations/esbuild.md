---
layout: doc
title: esbuild plugin - Generate code from OpenAPI
description: Add the kubb/esbuild plugin to build.ts so every esbuild build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 11
navigation:
  title: esbuild
  icon: i-simple-icons-esbuild
---

# Generate code from your API spec with esbuild

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The esbuild integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `build.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [build.ts]
import { build } from 'esbuild'
import kubb from 'kubb/esbuild'
import config from './kubb.config.ts'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [kubb({ config })],
})
```

## Run the build

Run your build script, such as `node build.ts`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
