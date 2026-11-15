---
layout: doc
title: Generate code from your API spec with Rolldown
description: Add the kubb/rolldown plugin to rolldown.config.ts so every Rolldown build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 9
navigation:
  title: Rolldown
  icon: i-simple-icons-rolldown
---

# Generate code from your API spec with Rolldown

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The Rolldown integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `rolldown.config.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

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

Run `rolldown -c`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
