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

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [rollup.config.ts]
import kubb from 'kubb/rollup'
import config from './kubb.config'

export default {
  input: 'src/index.ts',
  plugins: [kubb({ config })],
}
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
