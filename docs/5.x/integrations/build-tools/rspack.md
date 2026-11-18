---
layout: doc
title: Rspack plugin - Generate code from OpenAPI
description: Add the kubb/rspack plugin to rspack.config.ts so every Rspack build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 10
navigation:
  title: Rspack
  icon: i-iconoir-journal
---

# Generate code from your API spec with Rspack

`kubb/rspack` generates code from your `kubb.config.ts` once, before `rspack build` continues. It ships with `kubb`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `rspack.config.ts`

Pass one config object from your `kubb.config.ts` as `config`, not an array or a function.

```typescript [rspack.config.ts]
import kubb from 'kubb/rspack'
import config from './kubb.config.ts'

export default {
  plugins: [kubb({ config })],
}
```

## Run the build

Run `rspack build`. If Kubb fails, the build fails.

::

[How the build runs Kubb](/docs/5.x/integrations/build-tools#how-the-build-runs-kubb) covers defaults, reports, and watch rebuilds.
