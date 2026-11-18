# Barrel

The Barrel plugin writes `index.ts` files that re-export the generated code, so you import everything from one entry point.

It writes a barrel in every folder of each plugin output that has a barrel setting, plus a root barrel when you set `output.barrel` on `defineConfig`.

## Setup

No setup is needed. `defineConfig` adds `pluginBarrel()` to `plugins` when it is missing. Generator plugins such as `pluginTs()` turn on their own barrels in their default `output`, and a plugin without its own `output.barrel` inherits the root setting.

## Options worth knowing

`pluginBarrel()` takes no arguments. Configure it with `output.barrel`, on `defineConfig` or on one plugin.

| Setting                                                                              | Default  | What it does                                                                                         |
| ------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| [`type`](https://kubb.dev/extensions/kubb-labs/plugin-barrel/options#type)           | Required | `'named'` re-exports each symbol by name, which suits tree-shaking. `'all'` writes `export *`.       |
| [`nested`](https://kubb.dev/extensions/kubb-labs/plugin-barrel/options#nested)       | `false`  | Plugin only. Each barrel re-exports only its own folder and the barrels below it.                    |
| [`namespace`](https://kubb.dev/extensions/kubb-labs/plugin-barrel/options#namespace) | `false`  | Plugin only. Turns on nested barrels and adds a named namespace per subfolder, such as `PetService`. |
| `false`                                                                              |          | On a plugin, writes no barrel and leaves the plugin's files out of the root barrel.                  |

> [!WARNING]
> Passing your own `output` to a plugin replaces its default `barrel: { type: 'named' }`, so the plugin falls back to the root setting.

With [`shared`](https://kubb.dev/docs/5.x/reference/configuration#shared), barrels also re-export the shared schemas a config defines, and the shared directory gets none.

See [Barrel rules](https://kubb.dev/extensions/kubb-labs/plugin-barrel/guides/barrel-rules#which-barrel-setting-applies).

## Example

This config writes a root `src/gen/index.ts` that re-exports the generated types by name.

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  plugins: [pluginTs()],
})
```

```typescript [src/gen/index.ts]
export type { Category } from './types/Category'
export { petStatusEnum } from './types/Pet'
export type { Pet, PetStatusEnumKey } from './types/Pet'
```

::
