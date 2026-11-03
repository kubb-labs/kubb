---
layout: doc
title: Add barrel files
description: Generate index.ts barrel files for the output directory and for
  individual plugins with @kubb/plugin-barrel.
outline: deep
order: 6
navigation:
  title: Add barrel files
  icon: i-iconoir-packages
---

# Add barrel files

A barrel file is an `index.ts` that re-exports everything in a directory, so consumers import from one place. [`@kubb/plugin-barrel`](/extensions/kubb-labs/plugin-barrel) ships inside `kubb` and `defineConfig` registers it for you. It generates nothing until you set `output.barrel`.

Toggle the export style and barrel depth to see what each `index.ts` re-exports.

::barrel-tree
::

## Enable the root barrel

Set `output.barrel` on `defineConfig`. It controls the root `index.ts` and the default every plugin inherits. `type` is `'named'` for per-symbol re-exports or `'all'` for `export *`. See [`type`](/extensions/kubb-labs/plugin-barrel/options#type) for the difference.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  plugins: [pluginTs()],
})
```

## Adjust a single plugin

Set `barrel` inside a plugin's `output` to change or drop that plugin's barrel. `nested: true` writes an `index.ts` in every subdirectory instead of one flat barrel. `false` skips the plugin's barrel and drops its files from the root barrel. A plugin only gets a barrel in `output.mode: 'directory'`, the mode an extensionless `output.path` implies.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  plugins: [
    pluginTs({ output: { path: 'types', barrel: { type: 'all', nested: true } } }),
    pluginZod({ output: { path: 'zod', barrel: false } }),
  ],
})
```
