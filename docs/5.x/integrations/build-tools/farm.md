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

`kubb/farm` generates code from your `kubb.config.ts` once, before `farm build` continues. It ships with `kubb`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `farm.config.ts`

Pass one config object from your `kubb.config.ts` as `config`, not an array or a function.

```typescript [farm.config.ts]
import { defineConfig } from '@farmfe/core'
import kubb from 'kubb/farm'
import config from './kubb.config'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

## Run the build

Run `farm build`. If Kubb fails, the build fails.

::

[How the build runs Kubb](/docs/5.x/integrations/build-tools#how-the-build-runs-kubb) covers defaults, reports, and watch rebuilds.
