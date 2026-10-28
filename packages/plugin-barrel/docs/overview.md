# Barrel

The Barrel plugin writes `index.ts` files that re-export generated code, so you can import everything from a single entry point. It writes a barrel in every folder of each plugin output that has a barrel setting, plus a root barrel when you set `output.barrel` on `defineConfig`.

## Setup

Kubb adds the plugin to `plugins` for you, so no setup is needed. Generator plugins such as `pluginTs()` turn on their own barrels by default. Plugins without their own `output.barrel` inherit the root setting.

## Options worth knowing

`pluginBarrel()` takes no arguments. You configure it through `output.barrel`, on `defineConfig` or on a single plugin.

- `type: 'named'` re-exports each symbol by name, which suits tree-shaking. `type: 'all'` writes `export *`.
- `nested: true`, on a plugin only, makes each barrel re-export just its own folder and the barrels below it. The root barrel is always flat.
- `namespace: true`, on a plugin only, enables nested barrels and adds named namespaces for immediate subdirectories, alongside standalone exports.
- `false` on a plugin turns its barrel off and leaves its files out of the root barrel.

A plugin with `output.mode: 'file'` gets no barrel of its own, and the root barrel re-exports that file directly. Passing your own `output` object to a plugin replaces its default `barrel: { type: 'named' }`, so that plugin falls back to the root setting. When two files export the same name, Kubb reports an error, and a `named` barrel keeps only the first one.

See [Options](https://kubb.dev/extensions/kubb-labs/plugin-barrel/options) for every option and its default.

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
