---
layout: doc
title: Generate with esbuild
description: Run Kubb code generation during esbuild builds.
outline: [2, 3]
order: 11
navigation:
  title: esbuild
  icon: i-simple-icons-esbuild
---

# Generate with esbuild

::steps{level="2"}

<!--@include: ../../snippets/integrations/bundler-steps.md-->

```typescript [build.ts]
import { build } from 'esbuild'
import kubb from 'kubb/esbuild'
import config from './kubb.config'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  plugins: [kubb({ config })],
})
```

<!--@include: ../../snippets/integrations/bundler-notes.md-->
