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

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The Farm integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `farm.config.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [farm.config.ts]
import { defineConfig } from '@farmfe/core'
import kubb from 'kubb/farm'
import config from './kubb.config'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

## Run the build

Run `farm build`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
