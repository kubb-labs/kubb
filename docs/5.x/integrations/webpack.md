---
layout: doc
title: webpack plugin - Generate code from OpenAPI
description: Add the kubb/webpack plugin to webpack.config.ts so every webpack build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 7
navigation:
  title: webpack
  icon: i-simple-icons-webpack
---

# Generate code from your API spec with webpack

`kubb/webpack` generates code from your `kubb.config.ts` once, before the webpack build continues. It ships with `kubb`.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `webpack.config.ts`

Pass one config object from your `kubb.config.ts` as `config`, not an array or a function.

```typescript [webpack.config.ts]
import kubb from 'kubb/webpack'
import config from './kubb.config.ts'

export default {
  plugins: [kubb({ config })],
}
```

## Run the build

Run `webpack`. If Kubb fails, the build fails.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers defaults, reports, and watch rebuilds.
