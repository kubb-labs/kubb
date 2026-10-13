# Barrel plugin

The barrel plugin writes `index.ts` files that re-export generated code, one for each plugin's output and a root barrel when you set `output.barrel` on `defineConfig`, so you can import everything from a single entry point.

Kubb adds it to `plugins` for you. Do not add it yourself. It generates nothing until you configure `output.barrel`.

## Setup

Set `output.barrel` on `defineConfig` to write a root barrel. Plugins without a barrel setting of their own inherit it.

## Options

The plugin takes no arguments. You configure it through `output.barrel`, on `defineConfig` or on a single plugin.

- `type: 'named'` re-exports each symbol by name, which suits tree-shaking. `type: 'all'` writes `export *`.
- `nested: true`, on a plugin only, makes each barrel re-export just its own directory and the barrels below it. The root barrel is always flat.
- `false` on a plugin turns its barrel off and leaves its files out of the root barrel.

A plugin with `output.mode: 'file'` gets no barrel of its own. The root barrel re-exports that file directly. Passing your own `output` object to a plugin replaces its default `barrel: { type: 'named' }`, so it falls back to the root setting.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-barrel/options) for the export `type`, `nested` barrels, and per-plugin overrides.

## Example

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  plugins: [pluginTs()],
})
```
