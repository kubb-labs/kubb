---
layout: doc
title: Generate code from OpenAPI with Vite
description: Add the kubb/vite plugin to vite.config.ts so every Vite build generates code from your OpenAPI spec with the plugins in your kubb.config.ts.
outline: [2, 3]
order: 6
navigation:
  title: Vite
  icon: i-simple-icons-vite
---

# Generate code from OpenAPI with Vite

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
