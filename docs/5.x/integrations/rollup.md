---
layout: doc
title: Generate with Rollup
description: Run Kubb code generation during Rollup builds.
outline: [2, 3]
order: 8
navigation:
  title: Rollup
  icon: i-simple-icons-rollupdotjs
---

# Generate with Rollup

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
