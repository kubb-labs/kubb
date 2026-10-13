---
layout: doc
title: Generate with Farm
description: Run Kubb code generation during Farm builds.
outline: [2, 3]
order: 12
navigation:
  title: Farm
  icon: i-iconoir-light-bulb
---

# Generate with Farm

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
