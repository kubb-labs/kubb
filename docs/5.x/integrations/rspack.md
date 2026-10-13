---
layout: doc
title: Generate with Rspack
description: Run Kubb code generation during Rspack builds.
outline: [2, 3]
order: 10
navigation:
  title: Rspack
  icon: i-iconoir-journal
---

# Generate with Rspack

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [rspack.config.ts]
import kubb from 'kubb/rspack'
import config from './kubb.config'

export default {
  plugins: [kubb({ config })],
}
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
