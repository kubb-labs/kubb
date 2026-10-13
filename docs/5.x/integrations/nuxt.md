---
layout: doc
title: Generate with Nuxt
description: Run Kubb code generation during Nuxt builds.
outline: [2, 3]
order: 13
navigation:
  title: Nuxt
  icon: i-simple-icons-nuxt
---

# Generate with Nuxt

> [!IMPORTANT]
> This integration generates during builds only. Run `kubb generate` before starting the development server.

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [nuxt.config.ts]
import config from './kubb.config'

export default defineNuxtConfig({
  modules: [['kubb/nuxt', { config }]],
})
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
