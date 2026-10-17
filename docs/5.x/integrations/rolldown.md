---
layout: doc
title: Generate code from your API spec with Rolldown
description: Add the kubb/rolldown plugin to rolldown.config.ts so every Rolldown build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 9
navigation:
  title: Rolldown
  icon: i-simple-icons-rolldown
---

# Generate code from your API spec with Rolldown

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
