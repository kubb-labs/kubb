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

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [rspack.config.ts]
import kubb from 'kubb/rspack'
import config from './kubb.config'

export default {
  plugins: [kubb({ config })],
}
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
