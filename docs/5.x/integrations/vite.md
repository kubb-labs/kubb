---
layout: doc
title: Generate with Vite
description: Run Kubb code generation during Vite builds.
outline: [2, 3]
order: 6
navigation:
  title: Vite
  icon: i-simple-icons-vite
---

# Generate with Vite

> [!IMPORTANT]
> This integration generates during builds only. Run `kubb generate` before starting the development server.

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [vite.config.ts]
import kubb from 'kubb/vite'
import { defineConfig } from 'vite'
import config from './kubb.config'

export default defineConfig({
  plugins: [kubb({ config })],
})
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
