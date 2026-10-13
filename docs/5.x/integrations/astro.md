---
layout: doc
title: Generate with Astro
description: Run Kubb code generation during Astro builds.
outline: [2, 3]
order: 14
navigation:
  title: Astro
  icon: i-simple-icons-astro
---

# Generate with Astro

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
