---
layout: doc
title: Rolldown plugin - Generate code from OpenAPI
description: Add the kubb/rolldown plugin to rolldown.config.ts so every Rolldown build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 9
navigation:
  title: Rolldown
  icon: i-simple-icons-rolldown
---

# Generate code from your API spec with Rolldown

`kubb/rolldown` ships with `kubb`. It generates code from your `kubb.config.ts` once, before the Rolldown build continues.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `rolldown.config.ts`

Pass your `kubb.config.ts` as `config`. It takes one config object, not an array or a function.

```typescript [rolldown.config.ts]
import kubb from 'kubb/rolldown'
import { defineConfig } from 'rolldown'
import config from './kubb.config.ts'

export default defineConfig({
  input: 'src/index.ts',
  plugins: [kubb({ config })],
})
```

## Run the build

Run `rolldown -c`. A failed generation fails the build.

::

See [How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) for defaults, reports, and watch rebuilds.
