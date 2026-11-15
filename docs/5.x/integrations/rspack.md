---
layout: doc
title: Generate code from your API spec with Rspack
description: Add the kubb/rspack plugin to rspack.config.ts so every Rspack build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 10
navigation:
  title: Rspack
  icon: i-iconoir-journal
---

# Generate code from your API spec with Rspack

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The Rspack integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `rspack.config.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [rspack.config.ts]
import kubb from 'kubb/rspack'
import config from './kubb.config.ts'

export default {
  plugins: [kubb({ config })],
}
```

## Run the build

Run `rspack build`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
