# Options

`pluginBarrel` takes no arguments. You configure it through `output.barrel`, either on `defineConfig` to set the root barrel and the default every plugin inherits, or on a single plugin to override that plugin's barrel. The plugin-level behavior is also summarized under [`output.barrel`](https://kubb.dev/docs/5.x/reference/plugin-options#output-barrel) in the shared plugin options.

## Options overview

| Option                                    | Purpose                                                | Default                                                                                     |
| ----------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`output.barrel`](#output-barrel)         | Re-export style for the barrel files.                  | `false` on `defineConfig`, `{ type: 'named' }` in every generator plugin's default `output` |
| ↳ [`output.barrel.type`](#type)           | Named exports or a wildcard export.                    | Required when `output.barrel` is an object                                                  |
| ↳ [`output.barrel.nested`](#nested)       | Choose whether barrels reference subdirectory barrels. | `false`                                                                                     |
| ↳ [`output.barrel.namespace`](#namespace) | Expose each immediate group as a named namespace.      | `false`                                                                                     |

## Option details

### output.barrel

Kubb writes an `index.ts` in every directory of a plugin's output, and a root barrel when `output.barrel` is set on `defineConfig`. For two plugins that write to `models` and `clients`, with `output.barrel` set on `defineConfig`:

```text
src/gen
├── index.ts              root barrel
├── models
│   ├── index.ts          plugin barrel
│   ├── Pet.ts
│   └── User.ts
└── clients
    ├── index.ts          plugin barrel
    ├── pet
    │   ├── index.ts
    │   └── getPetById.ts
    └── store
        ├── index.ts
        └── getInventory.ts
```

|          |                                                                              |
| -------- | ---------------------------------------------------------------------------- |
| Type     | `{ type: 'all' \| 'named', nested?: boolean, namespace?: boolean } \| false` |
| Required | `false`                                                                      |
| Default  | `false`                                                                      |

The `type` field picks the export style. A plugin's `output.barrel` also accepts `nested`, so each barrel re-exports the barrels below it instead of the leaf files. Set `namespace: true` to add named group exports alongside the standalone exports. The root `output.barrel` accepts only `type` and always stays flat.

A plugin called without `output` uses its own default, which sets `barrel: { type: 'named' }`. If you pass your own `output` object, it replaces that default. `pluginTs({ output: { path: 'types' } })` then has no `barrel` and uses `config.output.barrel`, which is `false` unless you set it.

Set `barrel: { type: 'named' | 'all' }` on `defineConfig` to enable barrels everywhere: a root barrel, and the default every plugin without its own `output.barrel` inherits. A plugin that sets its own `output.barrel` overrides that inherited value, including back to `false`, which also drops its files from the root barrel. A plugin with `output.mode: 'file'` gets no barrel of its own, and the root barrel re-exports that file directly.

### type

Export style for the barrel files. Required whenever `output.barrel` is set to an object.

|          |                    |
| -------- | ------------------ |
| Type     | `'all' \| 'named'` |
| Required | `true`             |

::field-group

:::field{name="'named'"}
Re-exports each symbol by name from the file's named exports. Best for tree-shaking and explicit imports.
:::

:::field{name="'all'"}
Uses `export *`, a smaller barrel that re-exports everything.
:::

::

::code-group

```typescript ['named']
// src/gen/index.ts
export { getUser } from './api/user'
export { getPost, Post } from './api/post'
export { User } from './api/types/User'
```

```typescript ['all']
// src/gen/index.ts
export * from './api/user'
export * from './api/post'
export * from './api/types/User'
```

::

### nested

Changes what each barrel references. A barrel is written for every directory either way. With `nested: false`, the plugin's top barrel reaches through to the leaf files. With `nested: true`, each barrel re-exports only what sits directly inside its directory, including the subdirectory barrels below it, so callers can import from any depth. This field works on a plugin's `output.barrel` only.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

::code-group

```typescript [nested: false (default) → barrels reference leaf files]
// src/gen/api/index.ts
export * from './user'
export * from './post'
export * from './types/User'

// src/gen/api/types/index.ts
export * from './User'
```

```typescript [nested: true → barrels reference sub-barrels]
// src/gen/api/index.ts re-exports its files and subdirectories
export * from './user'
export * from './post'
export * from './types'

// src/gen/api/types/index.ts re-exports its files
export * from './User'
```

::

### namespace

Expose each immediate subdirectory as a named namespace, alongside its standalone exports. Editors can offer auto-imports for these namespaces when the generated files belong to the TypeScript project. This field works on a plugin's `output.barrel` only and enables nested barrels, even when `nested` is unset or `false`. The plugin needs its own `output.path`. A plugin that writes to the output root gets a warning and no namespaces.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

For tag-grouped fetch clients, use `group.name` to name the service directories. Leave fetch `sdk` unset so React Query can import the standalone operation functions.

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  plugins: [
    pluginTs({ output: { path: 'types' } }),
    pluginFetch({
      output: { path: 'client', barrel: { type: 'named', namespace: true } },
      group: { type: 'tag', name: ({ group }) => `${group}Service` },
    }),
    pluginReactQuery({ output: { path: 'hooks' } }),
  ],
})
```

For a `pet` tag, the operations land in `src/gen/client/petService/`. `src/gen/client/index.ts` exports both the operations and their PascalCase namespace:

```typescript [src/gen/client/index.ts]
export * from './petService/index'
export * as PetService from './petService/index'
```

Both calling styles remain available alongside the generated hooks and query options:

```typescript [src/example.ts]
import { PetService, getPet } from './gen/client'

await PetService.getPet({ path: { petId: '123' } })
await getPet({ path: { petId: '123' } })
```

An enabled root barrel also forwards `PetService`. Namespace names use the PascalCase directory name. Names starting with a digit get an `_` prefix, and names with no letters or digits become `_`. Conflicting exports produce a diagnostic. Change `group.name` to resolve collisions.
