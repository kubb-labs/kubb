---
layout: doc
title: Farm plugin - Generate code from OpenAPI
description: Add the kubb/farm plugin to farm.config.ts so every Farm build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 12
navigation:
  title: Farm
  icon: i-iconoir-light-bulb
---

# Generate code from your API spec with Farm

`kubb/farm` ships with `kubb`. It generates code from your `kubb.config.ts` once, before `farm build` continues.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `farm.config.ts`

Pass your `kubb.config.ts` as `config`. It takes one config object, not an array or a function.

```typescript [farm.config.ts]
import { defineConfig } from '@farmfe/core'
import kubb from 'kubb/farm'
import config from './kubb.config'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

## Run the build

Run `farm build`. A failed generation fails the build.

::

See [How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) for defaults, reports, and watch rebuilds.
