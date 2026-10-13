# Barrel

The barrel plugin writes `index.ts` files that re-export generated code, so you can import everything from a single entry point. It writes a barrel in every folder of each plugin's output, plus a root barrel when you set `output.barrel` on `defineConfig`.

## Setup

Kubb adds the plugin to `plugins` for you, so you do not need to add it yourself. Generator plugins such as `pluginTs()` turn on their own barrels by default. Set `output.barrel` on `defineConfig` to also write a root barrel. Plugins without a barrel setting of their own inherit it.

## Options worth knowing

The plugin takes no arguments. You configure it through `output.barrel`, on `defineConfig` or on a single plugin.

- `type: 'named'` re-exports each symbol by name, which suits tree-shaking. `type: 'all'` writes `export *`.
- `nested: true`, on a plugin only, makes each barrel re-export just its own folder and the barrels below it. The root barrel is always flat.
- `false` on a plugin turns its barrel off and leaves its files out of the root barrel.

A plugin with `output.mode: 'file'` gets no barrel of its own, and the root barrel re-exports that file directly. Passing your own `output` object to a plugin replaces its default `barrel: { type: 'named' }`, so it falls back to the root setting. When two files export the same name, the barrel keeps the first one and reports an error.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-barrel/options) for the export `type`, `nested` barrels, and per-plugin overrides.

## Example

The config below writes a root `src/gen/index.ts` that re-exports the generated types by name.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  plugins: [
    pluginTs(),
  ],
})
```

## See also

- [`output.barrel` in the Kubb configuration](https://kubb.dev/docs/5.x/reference/configuration#outputbarrel)
