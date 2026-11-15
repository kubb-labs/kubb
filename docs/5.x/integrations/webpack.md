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

::steps{level="2"}

## Install Kubb and your plugins

Follow [Installation](/docs/5.x/how-to/installation). The webpack integration ships with `kubb`, so there is nothing else to install.

## Add Kubb to `webpack.config.ts`

Pass your `kubb.config.ts` as `config`. It must be one config object, not the array or function forms `defineConfig` accepts.

```typescript [webpack.config.ts]
import kubb from 'kubb/webpack'
import config from './kubb.config.ts'

export default {
  plugins: [kubb({ config })],
}
```

## Run the build

Run `webpack`. Kubb generates once, before the build continues, and a failed generation fails the build.

::

[How the build runs Kubb](/docs/5.x/integrations/overview#how-the-build-runs-kubb) covers the defaults it applies, the reports it prints, and watch rebuilds.
