# Options

`pluginBarrel()` takes no arguments. You configure it through `output.barrel`: on `defineConfig` for the root barrel and the default every plugin inherits, or on one plugin to override that plugin's barrels. [Shared plugin options](https://kubb.dev/docs/5.x/reference/plugin-options#output-barrel) summarize the plugin-level setting.

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

The root `output.barrel` accepts only `type` and is always flat. How the root and plugin settings combine:

| Root `output.barrel` | Plugin `output.barrel`                                                                                 | Plugin barrels               | Root barrel                      |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- | -------------------------------- |
| `false` (default)    | Plugin default `{ type: 'named' }`                                                                     | Yes                          | No                               |
| `false` (default)    | Unset, because your own `output` replaced the default, as in `pluginTs({ output: { path: 'types' } })` | No                           | No                               |
| `{ type }`           | Unset                                                                                                  | Yes, with the root `type`    | Yes                              |
| `{ type }`           | `{ type, … }`                                                                                          | Yes, with the plugin setting | Yes                              |
| `{ type }`           | `false`                                                                                                | No                           | Yes, without this plugin's files |

Cases where a plugin gets no barrel of its own:

| Case                                                            | Result                                               |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| `output.mode: 'file'`                                           | The root barrel re-exports the single file directly. |
| The plugin writes to the output root, with no own `output.path` | The root barrel picks up its files.                  |
| `output.path` resolves outside the root `output.path`           | The build fails with `KUBB_PATH_TRAVERSAL`.          |

What goes into a barrel:

- Every `.ts`, `.tsx`, `.js`, and `.jsx` file below the folder, sorted by name. Other `index.ts` files are not re-exported as leaves.
- The barrel file is always `index.ts`.
- A plugin's barrels get its `output.banner` and `output.footer` only when the plugin sets them. They never get the default "Generated by Kubb" notice, and the root barrel gets neither.
- When two files export the same name, Kubb reports [`KUBB_BARREL_DUPLICATE_EXPORT`](https://kubb.dev/docs/5.x/reference/diagnostics#kubb-barrel-duplicate-export). A `named` barrel keeps only the first export. Rename one declaration, or change the plugin `resolver` to produce distinct names.

### type

Export style of the barrel files.

|          |                                          |
| -------- | ---------------------------------------- |
| Type     | `'all' \| 'named'`                       |
| Required | `true` when `output.barrel` is an object |

::field-group

:::field{name="'named'"}
Re-exports each symbol by name, with values and types in separate statements. It suits tree-shaking and explicit imports. A file without sources is re-exported whole.
:::

:::field{name="'all'"}
Writes `export *` per file, a smaller barrel. A file whose sources are all marked as not indexable is left out.
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

A subfolder barrel is always chained with `export *`, also for `type: 'named'`, because the child barrel already lists the names.

### namespace

Exposes each immediate subfolder as a named namespace, next to its standalone exports. Editors can offer auto-imports for these namespaces when the generated files belong to the TypeScript project.

|          |           |
| -------- | --------- |
| Type     | `boolean` |
| Required | `false`   |
| Default  | `false`   |

- Works on a plugin's `output.barrel` only, and turns on nested barrels even when `nested` is unset or `false`.
- Needs the plugin's own `output.path`. A plugin that writes to the output root gets a `KUBB_PLUGIN_WARNING` and no namespaces.
- A namespace takes the PascalCase folder name. A name that does not start with a letter gets an `_` prefix, and a name with no letters or digits becomes `_`.
- An enabled root barrel forwards the namespaces too.
- Conflicting exports report a diagnostic. Change `group.name` to resolve them.

For tag-grouped fetch clients, name the service folders with `group.name`. Leave the fetch `sdk` option unset so React Query can import the standalone operation functions.

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

For a `pet` tag, the operations land in `src/gen/client/petService/`. Both calling styles work next to the generated hooks and query options. `integerType: 'number'` types `int64` ids as `number`, so the example can pass `123`. A `number` loses precision above `Number.MAX_SAFE_INTEGER`, so keep the default `bigint` for larger ids and pass `123n`.
