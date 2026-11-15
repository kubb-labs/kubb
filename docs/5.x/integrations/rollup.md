---
layout: doc
title: Generate code from your API spec with Rollup
description: Add the kubb/rollup plugin to rollup.config.ts so every Rollup build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 8
navigation:
  title: Rollup
  icon: i-simple-icons-rollupdotjs
---

# Generate code from your API spec with Rollup

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The Rollup integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `rollup.config.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [rollup.config.ts]
import kubb from 'kubb/rollup'
import config from './kubb.config.ts'

export default {
  input: 'src/index.ts',
  plugins: [kubb({ config })],
}
```

## Run the build

Run `rollup -c`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
