---
layout: doc
title: Generate code from OpenAPI with Astro
description: Add the kubb/astro integration to astro.config.mjs so every Astro build generates code from your OpenAPI spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 14
navigation:
  title: Astro
  icon: i-simple-icons-astro
---

# Generate code from OpenAPI with Astro

> [!IMPORTANT]
> This integration generates during builds only. Run `kubb generate` before starting the development server.

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [astro.config.mjs]
import { defineConfig } from 'astro/config'
import kubb from 'kubb/astro'
import config from './kubb.config'

export default defineConfig({
  integrations: [kubb({ config })],
})
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
