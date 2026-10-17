---
layout: doc
title: Generate code from your API spec with Nuxt
description: Add the kubb/nuxt module to nuxt.config.ts so every Nuxt build generates code from your API spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 13
navigation:
  title: Nuxt
  icon: i-simple-icons-nuxt
---

# Generate code from your API spec with Nuxt

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
