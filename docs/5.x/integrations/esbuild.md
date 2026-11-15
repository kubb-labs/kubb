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

`kubb/esbuild` ships with `kubb`. It generates code from your `kubb.config.ts` once, before the esbuild build continues.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `build.ts`

Pass your `kubb.config.ts` as `config`. It takes one config object, not an array or a function.

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

Run your build script, such as `node build.ts`. A failed generation fails the build.

::

See [How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) for defaults, reports, and watch rebuilds.
