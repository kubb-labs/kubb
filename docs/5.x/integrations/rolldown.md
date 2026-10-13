---
layout: doc
title: Generate with Rolldown
description: Run Kubb code generation during Rolldown builds.
outline: [2, 3]
order: 9
navigation:
  title: Rolldown
  icon: i-simple-icons-rolldown
---

# Generate with Rolldown

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [rolldown.config.ts]
import kubb from 'kubb/rolldown'
import { defineConfig } from 'rolldown'
import config from './kubb.config'

export default defineConfig({
  input: 'src/index.ts',
  plugins: [kubb({ config })],
})
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
