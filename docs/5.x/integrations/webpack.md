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

`kubb/webpack` ships with `kubb`. It generates code from your `kubb.config.ts` once, before the webpack build continues.

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation).

## Add Kubb to `webpack.config.ts`

Pass your `kubb.config.ts` as `config`. It takes one config object, not an array or a function.

```typescript [webpack.config.ts]
import kubb from 'kubb/webpack'
import config from './kubb.config.ts'

export default {
  plugins: [kubb({ config })],
}
```

## Run the build

Run `webpack`. A failed generation fails the build.

::

See [How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) for defaults, reports, and watch rebuilds.
