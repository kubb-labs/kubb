---
layout: doc
title: Generate code from your API spec with Farm
description: Add the kubb/farm plugin to farm.config.ts so every Farm build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 12
navigation:
  title: Farm
  icon: i-iconoir-light-bulb
---

# Generate code from your API spec with Farm

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [farm.config.ts]
import { defineConfig } from '@farmfe/core'
import kubb from 'kubb/farm'
import config from './kubb.config'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
