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

`kubb/esbuild` generates code from your `kubb.config.ts` once, before the esbuild build continues. It ships with `kubb`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `build.ts`

Pass one config object from your `kubb.config.ts` as `config`, not an array or a function.

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

Run your build script, such as `node build.ts`. If Kubb fails, the build fails.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers defaults, reports, and watch rebuilds.
