# Options

`pluginBarrel()` takes no arguments. Configure it with `output.barrel` on `defineConfig` or on one plugin.

`output.barrel` on `defineConfig` sets the root barrel and the default every plugin inherits. On a plugin, it overrides that plugin's barrels. [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options#output-barrel) summarize the plugin-level setting.

## Options overview

| Option                                             | Purpose                                                         | Default                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| [`output.barrel`](#outputbarrel) on `defineConfig` | Root barrel, and the value plugins inherit.                     | `false`                                                         |
| [`output.barrel`](#outputbarrel) on a plugin       | That plugin's barrels.                                          | `{ type: 'named' }` in each generator plugin's default `output` |
| ↳ [`output.barrel.type`](#type)                    | Named exports or a wildcard export.                             | Required when `output.barrel` is an object                      |
| ↳ [`output.barrel.nested`](#nested)                | Re-export subfolder barrels instead of leaf files. Plugin only. | `false`                                                         |
| ↳ [`output.barrel.namespace`](#namespace)          | Add a named namespace per subfolder. Plugin only.               | `false`                                                         |

## Option details

### output.barrel

Kubb writes an `index.ts` in every folder of a plugin's output, and a root barrel when `output.barrel` is set on `defineConfig`. For two plugins that write to `models` and `clients`:

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

- The root `output.barrel` accepts only `type` and is always flat.
- A plugin without its own `output.barrel` uses the root `type`.
- `false` on a plugin writes no barrel for it and leaves its files out of the root barrel.

> [!WARNING]
> Passing your own `output` to a plugin, as in `pluginTs({ output: { path: 'types' } })`, replaces its default `{ type: 'named' }`. With the root `output.barrel` at `false`, that plugin then gets no barrels.

See [Barrel files](EDGE:barrel-files).

See [Name collisions](EDGE:name-collisions).

### type

Export style of the barrel files.

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'all' \| 'named'`                       |
| Required | `true` when `output.barrel` is an object |

::field-group

:::field{name="'named'"}
Re-exports each symbol by name, with values and types in separate statements. It suits tree-shaking and explicit imports.
:::

:::field{name="'all'"}
Writes `export *` per file, a smaller barrel.
:::

::

For a plugin output with `post.ts`, `types/User.ts`, and `user.ts`:

::code-group

```typescript ['named']
// src/gen/api/index.ts
export { getPost } from './post'
export type { Post } from './post'
export type { User } from './types/User'
export { getUser } from './user'
```

```typescript ['all']
// src/gen/api/index.ts
export * from './post'
export * from './types/User'
export * from './user'
```

::

### nested

Changes what each barrel references. Kubb writes a barrel in every folder either way. This field works on a plugin's `output.barrel` only.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

| Value             | The plugin's top barrel re-exports                 | Import from    |
| ----------------- | -------------------------------------------------- | -------------- |
| `false` (default) | Every leaf file below it                           | The top folder |
| `true`            | Its own files and the `index.ts` of each subfolder | Any depth      |

::code-group

```typescript [nested: false]
// src/gen/api/index.ts
export * from './post'
export * from './types/User'
export * from './user'

// src/gen/api/types/index.ts
export * from './User'
```

```typescript [nested: true]
// src/gen/api/index.ts
export * from './post'
export * from './types/index'
export * from './user'

// src/gen/api/types/index.ts
export * from './User'
```

::

### namespace

Exposes each immediate subfolder as a named namespace, such as `PetService`, next to its standalone exports.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

- Works on a plugin's `output.barrel` only, and turns on nested barrels even when `nested` is unset or `false`.
- Needs the plugin's own `output.path`. A plugin that writes to the output root gets a `KUBB_PLUGIN_WARNING` and no namespaces.
- A namespace takes the PascalCase folder name. Name the folders with `group.name`.

For tag-grouped fetch clients, leave the fetch `sdk` option unset so React Query can import the standalone operation functions:

::code-group

```typescript [kubb.config.ts]
import { defineConfig } from 'kubb/config'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  input: './petStore.yaml',
  output: { path: './src/gen', barrel: { type: 'named' } },
  adapter: adapterOas({ integerType: 'number' }),
  plugins: [
    pluginTs({ output: { path: 'types' } }),
    pluginFetch({
      output: { path: 'client', barrel: { type: 'named', namespace: true } },
      group: { type: 'tag', name: ({ group }) => `${group}Service` },
    }),
    pluginReactQuery({ output: { path: 'hooks' }, hooks: true }),
  ],
})
```

```typescript [src/gen/client/index.ts]
export * from './petService/index'
export * as PetService from './petService/index'
```

```typescript [src/example.ts]
import { PetService, getPetById } from './gen/client'

await PetService.getPetById({ path: { petId: 123 } })
await getPetById({ path: { petId: 123 } })
```

::

For a `pet` tag, the operations land in `src/gen/client/petService/`. The example sets [`integerType: 'number'`](https://kubb.dev/extensions/kubb-labs/adapter-oas/options#integertype), so it can pass `123` as an `int64` id.

See [Barrel files](EDGE:barrel-files).
