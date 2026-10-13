---
layout: doc
title: Generate with webpack
description: Run Kubb code generation during webpack builds.
outline: [2, 3]
order: 7
navigation:
  title: webpack
  icon: i-simple-icons-webpack
---

# Generate with webpack

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
