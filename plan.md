# Plan: `@kubb/middleware-barrel`

## Problem

Barrel-file generation must be decoupled from individual plugins and from the core build engine. Currently there is no first-class "middleware" concept in Kubb — middleware needs to:

1. Add `output.barrelType` to the root `Config['output']` and to each plugin's `Output` type (the shared `Output` type in `@kubb/core`).
2. Hook into the build lifecycle at the right moment to read every plugin's generated files and write the barrel files after all plugins have finished.

---

## API: `output.barrelType` via `declare global { namespace Kubb }`

`BarrelType` and `barrelType` are **not** part of `@kubb/core`'s `Output` or `Config` types. Core knows nothing about barrel generation.

`@kubb/core` already exposes an extension point — `declare global { namespace Kubb { interface PluginRegistry } }` — used by plugins to register themselves for `getPlugin`/`requirePlugin` typed lookups. Middleware packages follow the same pattern, adding new **keyed registry interfaces** to the `Kubb` namespace that third-party packages can augment:

```ts
// packages/core/src/Kubb.ts  (additions to existing declare global block) ✅ IMPLEMENTED

declare global {
  namespace Kubb {
    interface PluginRegistry {}   // already exists

    /**
     * Extension point for root `Config['output']` options.
     * Augment the `output` key in middleware or plugin packages to add extra fields
     * to the global output configuration without touching core types.
     *
     * @example
     * ```ts
     * // packages/middleware-barrel/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface ConfigOptionsRegistry {
     *       output: {
     *         barrelType?: import('./types.ts').BarrelType | false
     *       }
     *     }
     *   }
     * }
     * ```
     */
    interface ConfigOptionsRegistry {}

    /**
     * Extension point for per-plugin `Output` options.
     * Augment the `output` key in middleware or plugin packages to add extra fields
     * to the per-plugin output configuration without touching core types.
     *
     * @example
     * ```ts
     * // packages/middleware-barrel/src/types.ts
     * declare global {
     *   namespace Kubb {
     *     interface PluginOptionsRegistry {
     *       output: {
     *         barrelType?: import('./types.ts').BarrelType | false
     *       }
     *     }
     *   }
     * }
     * ```
     */
    interface PluginOptionsRegistry {}
  }
}
```

`Output` and the root config output are then typed as conditional intersections so that augmentations are only applied when a middleware/plugin actually provides the `output` key:

```ts
// packages/core/src/types.ts  ✅ IMPLEMENTED

export type Output = {
  path: string
  banner?: string | ((file: FileNode) => string)
  footer?: string | ((file: FileNode) => string)
  override?: boolean
} & ('output' extends keyof Kubb.PluginOptionsRegistry ? Kubb.PluginOptionsRegistry['output'] : {})

// and similarly for Config['output']:
// } & ('output' extends keyof Kubb.ConfigOptionsRegistry ? Kubb.ConfigOptionsRegistry['output'] : {})
```

`@kubb/middleware-barrel` augments those interfaces:

```ts
// packages/middleware-barrel/src/types.ts

export type BarrelType = 'all' | 'named' | 'propagate'

declare global {
  namespace Kubb {
    interface PluginOptionsRegistry {
      output: {
        barrelType?: BarrelType | false
      }
    }
    interface ConfigOptionsRegistry {
      output: {
        barrelType?: BarrelType | false
      }
    }
  }
}
```

### User-facing config

When a project imports `@kubb/middleware-barrel`, the `declare global` augmentation is pulled in automatically, making `barrelType` valid in `kubb.config.ts`:

```ts
import { middlewareBarrel } from '@kubb/middleware-barrel'

export default defineConfig({
  output: { path: 'src/gen', barrelType: 'named' },
  plugins: [
    pluginTs({ output: { path: 'types', barrelType: 'all' } }),
    pluginZod({ output: { path: 'schemas' } }),
    pluginClient({ output: { path: 'client', barrelType: false } }),
    middlewareBarrel(),
  ],
})
```

At runtime `barrelType` is opaque to core — `middleware-barrel` casts `output` to its own augmented type internally.

---

## Middleware runtime: `defineMiddleware` in `@kubb/core`

### What a middleware is

A middleware is a plain object that attaches listeners to the `AsyncEventEmitter<KubbHooks>` before the build loop runs. It has no generators of its own; it only observes and mutates the file set produced by other plugins.

```ts
// packages/core/src/defineMiddleware.ts  (new file)

export type Middleware = {
  name: string
  /**
   * Called during `createKubb` after `setup()` but before the plugin
   * execution loop starts. Use this to attach listeners on `hooks`.
   */
  install(hooks: AsyncEventEmitter<KubbHooks>): void
}

export function defineMiddleware(middleware: Middleware): Middleware {
  return middleware
}
```

### Where `createKubb` calls middleware

`createKubb` already accepts a `Config` that contains `plugins`. Middleware is passed separately (or appended to a dedicated `config.middleware` array) and wired in during `setup()`:

```ts
// packages/core/src/createKubb.ts  (conceptual diff)

async function setup(userConfig: UserConfig) {
  // … existing setup …

  for (const mw of userConfig.middleware ?? []) {
    mw.install(hooks)          // attach all listeners before the build loop
  }

  // … build loop runs, plugins generate files …
}
```

Alternatively, middleware can be passed as an array on `Config`:

```ts
// packages/core/src/types.ts  (addition)
export type Config = {
  // …existing fields…
  /**
   * Middleware instances that observe and post-process the build output.
   * Each middleware receives the `hooks` emitter and attaches its own listeners.
   */
  middleware?: Array<Middleware>
}
```

---

## `@kubb/middleware-barrel` runtime

### Execution order — the `enforce: 'post'` equivalent

Plugins use `enforce: 'post'` to run after all normal plugins. Middleware has a simpler guarantee: **middleware listeners are always registered after all plugin listeners**, because `createKubb` installs middleware in `setup()` only after the `PluginDriver` has already registered every plugin's hooks.

```
createKubb setup() call order
──────────────────────────────────────────────────────────────
1. PluginDriver.install(config)       ← registers all plugin hooks
2. for (mw of config.middleware)      ← installs middleware listeners
     mw.install(hooks)                  (always AFTER all plugin hooks)
3. hooks.emit('kubb:plugin:setup')   ← build loop begins
```

Because `AsyncEventEmitter` calls listeners in registration order, middleware listeners for any event fire **after** all plugin listeners for that same event. This means:

- `kubb:plugin:end` in middleware fires after the plugin's own `kubb:plugin:end` — all of that plugin's files are already in `FileManager`.
- `kubb:build:end` in middleware fires after every plugin's `kubb:build:end` — the complete file set is available.

No `enforce: 'post'` flag, no `priority` field, no special ordering needed on `Middleware` — the install sequence itself guarantees barrel generation always comes last.

### Lifecycle hooks used

| Hook | Purpose |
|---|---|
| `kubb:build:start` | Capture `config`, `upsertFile`, and the lazy `files` reference |
| `kubb:plugin:end` | After each plugin finishes, generate that plugin's per-plugin barrel (index.ts inside its `output.path`) |
| `kubb:build:end` | After all plugins finish, generate the root barrel (index.ts at `config.output.path`) |

### `middleware.ts` skeleton

```ts
// packages/middleware-barrel/src/middleware.ts

import { defineMiddleware } from '@kubb/core'
import type { KubbBuildStartContext } from '@kubb/core'
import { generatePerPluginBarrel, generateRootBarrel } from './utils.ts'

export const middlewareBarrel = defineMiddleware({
  name: 'middleware-barrel',

  install(hooks) {
    let ctx: KubbBuildStartContext

    hooks.on('kubb:build:start', (buildCtx) => {
      ctx = buildCtx
    })

    hooks.on('kubb:plugin:end', ({ plugin }) => {
      const barrelType = plugin.options?.output?.barrelType
        ?? ctx.config.output.barrelType
      if (!barrelType) return

      const pluginFiles = ctx.files.filter(
        (f) => f.meta?.pluginName === plugin.name,
      )
      const barrelFiles = generatePerPluginBarrel({
        barrelType,
        pluginName: plugin.name,
        outputPath: plugin.options.output.path,
        files: pluginFiles,
        config: ctx.config,
      })
      ctx.upsertFile(...barrelFiles)
    })

    hooks.on('kubb:build:end', () => {
      const rootBarrelType = ctx.config.output.barrelType
      if (!rootBarrelType) return

      const rootBarrelFiles = generateRootBarrel({
        barrelType: rootBarrelType,
        outputPath: ctx.config.output.path,
        files: ctx.files,
        config: ctx.config,
      })
      ctx.upsertFile(...rootBarrelFiles)
    })
  },
})
```

### `utils.ts` — barrel file generation helpers

```ts
// packages/middleware-barrel/src/utils.ts

export function generatePerPluginBarrel(params: {
  barrelType: BarrelType
  pluginName: string
  outputPath: string
  files: ReadonlyArray<FileNode>
  config: Config
}): Array<FileNode>

export function generateRootBarrel(params: {
  barrelType: BarrelType
  outputPath: string
  files: ReadonlyArray<FileNode>
  config: Config
}): Array<FileNode>
```

These helpers use a `TreeNode` structure (directory tree) to determine which files to re-export and produce `FileNode` objects with `export * from '…'` or named-export statements.

---

## File-level changes

### `packages/core/src/types.ts` ✅ done
- Change `Output` type to conditionally intersect with `Kubb.PluginOptionsRegistry['output']`.
- Change the inline root `Config['output']` type to conditionally intersect with `Kubb.ConfigOptionsRegistry['output']`.
- Add `middleware?: Array<Middleware>` to `Config` and `UserConfig`.
- **No** `BarrelType`, no `barrelType` field — those live solely in `@kubb/middleware-barrel`.

### `packages/core/src/Kubb.ts` ✅ done
- Add `interface ConfigOptionsRegistry {}` and `interface PluginOptionsRegistry {}` to the existing `declare global { namespace Kubb { ... } }` block.
- Document the augmentation pattern in JSDoc (mirrors existing `PluginRegistry` docs).

### `packages/core/src/defineMiddleware.ts` *(new)*
- `Middleware` type + `defineMiddleware` factory

### `packages/core/src/createKubb.ts`
- After `setup()`, iterate `config.middleware` and call `mw.install(hooks)`

### `packages/core/src/index.ts`
- Export `Middleware`, `defineMiddleware`
- **No** `BarrelType` export

### `packages/middleware-barrel/` (new package)
| File | Purpose |
|---|---|
| `package.json` | `name: "@kubb/middleware-barrel"`, peer-depends on `@kubb/core` |
| `tsconfig.json` | Mirrors other packages |
| `src/types.ts` | `export type BarrelType`; `declare global { namespace Kubb { interface OutputExtensions; interface ConfigOutputExtensions } }` |
| `src/constants.ts` | `BARREL_BASENAME`, `BARREL_FILENAME` |
| `src/utils/TreeNode.ts` | Directory-tree helper for barrel resolution |
| `src/utils/getBarrelFiles.ts` | Converts a `TreeNode` into `FileNode[]` barrel files |
| `src/utils.ts` | `generatePerPluginBarrel`, `generateRootBarrel` |
| `src/middleware.ts` | `middlewareBarrel` — the `defineMiddleware` export |
| `src/index.ts` | Re-exports `middlewareBarrel`, `BarrelType`, types |

---

## Key design properties

| Concern | Owner |
|---|---|
| `Kubb.ConfigOptionsRegistry` + `Kubb.PluginOptionsRegistry` extension interfaces | `@kubb/core` |
| `Output` / `Config['output']` conditional-intersection with registry keys | `@kubb/core` |
| `BarrelType` type + `output.barrelType` augmentation | `@kubb/middleware-barrel` |
| `Middleware` type + `defineMiddleware` factory | `@kubb/core` |
| Middleware install call during `setup()` | `@kubb/core/createKubb.ts` |
| Barrel-specific runtime logic | `@kubb/middleware-barrel` |
| Individual plugins | **zero changes** |
| Root `Config` | gains `middleware` array; `barrelType` on `output` via registry augmentation |

---

## Checklist

- [x] Add `Kubb.ConfigOptionsRegistry` and `Kubb.PluginOptionsRegistry` interfaces to `packages/core/src/Kubb.ts`
- [x] Update `Output` type in `packages/core/src/types.ts` to conditionally intersect with `Kubb.PluginOptionsRegistry['output']`
- [x] Update root `Config['output']` in `packages/core/src/types.ts` to conditionally intersect with `Kubb.ConfigOptionsRegistry['output']`
- [ ] Add `middleware?: Array<Middleware>` to `Config` / `UserConfig`
- [ ] Create `packages/core/src/defineMiddleware.ts` with `Middleware` type + factory
- [ ] Export new symbols from `packages/core/src/index.ts`
- [ ] Wire `config.middleware` install loop into `createKubb.ts` `setup()`
- [ ] Scaffold `packages/middleware-barrel/` (package.json, tsconfig.json, src/)
- [ ] Implement `BarrelType` type + `declare global` augmentation in `middleware-barrel/src/types.ts`
- [ ] Implement `TreeNode`, `getBarrelFiles`, `generatePerPluginBarrel`, `generateRootBarrel`
- [ ] Implement `middlewareBarrel` in `middleware-barrel/src/middleware.ts`
- [ ] Export from `middleware-barrel/src/index.ts`
- [ ] Add `@kubb/middleware-barrel` to `pnpm-workspace.yaml`
- [ ] Add changeset entries for `@kubb/core` and `@kubb/middleware-barrel`
