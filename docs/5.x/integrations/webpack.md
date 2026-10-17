---
layout: doc
title: Generate code from OpenAPI with webpack
description: Add the kubb/webpack plugin to webpack.config.ts so every webpack build generates code from your OpenAPI spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 7
navigation:
  title: webpack
  icon: i-simple-icons-webpack
---

# Generate code from OpenAPI with webpack

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [webpack.config.ts]
import kubb from 'kubb/webpack'
import config from './kubb.config'

export default {
  plugins: [kubb({ config })],
}
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
