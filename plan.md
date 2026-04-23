# Plan: `@kubb/middleware-barrel`

## Problem

Barrel-file generation must be decoupled from individual plugins and from the core build engine. Currently there is no first-class "middleware" concept in Kubb — middleware needs to:

1. Add `output.barrelType` to the root `Config['output']` and to each plugin's `Output` type (the shared `Output` type in `@kubb/core`).
2. Hook into the build lifecycle at the right moment to read every plugin's generated files and write the barrel files after all plugins have finished.

---

## API: `output.barrelType`

The user-facing field lives on the **shared `Output` type** in `@kubb/core` (and therefore automatically on every plugin's `output` too) and on the root `Config['output']` object.

```ts
// packages/core/src/types.ts  (additions only)

export type BarrelType = 'all' | 'named' | 'propagate'

export type Output = {
  path: string
  banner?: …
  footer?: …
  override?: boolean
  /**
   * Controls barrel-file (index.ts) generation for this plugin's output.
   * - `'all'`       — export everything with `export * from '…'`
   * - `'named'`     — export only named exports (`export { Foo } from '…'`)
   * - `'propagate'` — write a barrel even if the plugin produces no files
   * - `false`       — disable barrel generation for this plugin
   * Inherits the root `Config.output.barrelType` when omitted.
   */
  barrelType?: BarrelType | false
}
```

Root config gains the same field automatically (its inline `output` object mirrors `Output`):

```ts
output: {
  path: string
  clean?: boolean
  // …existing fields…
  /**
   * Default barrelType for every plugin that does not set its own `output.barrelType`.
   * Omit (or set `false`) to disable barrel generation entirely.
   */
  barrelType?: BarrelType | false
}
```

### User-facing config

```ts
export default defineConfig({
  output: { path: 'src/gen', barrelType: 'named' },   // root default
  plugins: [
    pluginTs({ output: { path: 'types', barrelType: 'all' } }),  // per-plugin override
    pluginZod({ output: { path: 'schemas' } }),                  // inherits 'named'
    pluginClient({ output: { path: 'client', barrelType: false } }), // opt-out
    middlewareBarrel(),    // drives the actual barrel generation
  ],
})
```

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

### `packages/core/src/types.ts`
- Export `BarrelType = 'all' | 'named' | 'propagate'`
- Add `barrelType?: BarrelType | false` to the shared `Output` type
- Add `barrelType?: BarrelType | false` to the inline `Config['output']` object
- Add `middleware?: Array<Middleware>` to `Config` and `UserConfig`

### `packages/core/src/defineMiddleware.ts` *(new)*
- `Middleware` type + `defineMiddleware` factory

### `packages/core/src/createKubb.ts`
- After `setup()`, iterate `config.middleware` and call `mw.install(hooks)`

### `packages/core/src/index.ts`
- Export `BarrelType`, `Middleware`, `defineMiddleware`

### `packages/middleware-barrel/` (new package)
| File | Purpose |
|---|---|
| `package.json` | `name: "@kubb/middleware-barrel"`, peer-depends on `@kubb/core` |
| `tsconfig.json` | Mirrors other packages |
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
| `BarrelType` type + `output.barrelType` field | `@kubb/core` |
| `Middleware` type + `defineMiddleware` factory | `@kubb/core` |
| Middleware install call during `setup()` | `@kubb/core/createKubb.ts` |
| Barrel-specific runtime logic | `@kubb/middleware-barrel` |
| Individual plugins | **zero changes** |
| Root `Config` | gains only `barrelType` on `output` and `middleware` array |

---

## Checklist

- [ ] Add `BarrelType` to `packages/core/src/types.ts`
- [ ] Add `barrelType?: BarrelType | false` to the shared `Output` type
- [ ] Add `barrelType?: BarrelType | false` to `Config['output']`
- [ ] Add `middleware?: Array<Middleware>` to `Config` / `UserConfig`
- [ ] Create `packages/core/src/defineMiddleware.ts` with `Middleware` type + factory
- [ ] Export new symbols from `packages/core/src/index.ts`
- [ ] Wire `config.middleware` install loop into `createKubb.ts` `setup()`
- [ ] Scaffold `packages/middleware-barrel/` (package.json, tsconfig.json, src/)
- [ ] Implement `TreeNode`, `getBarrelFiles`, `generatePerPluginBarrel`, `generateRootBarrel`
- [ ] Implement `middlewareBarrel` in `middleware-barrel/src/middleware.ts`
- [ ] Export from `middleware-barrel/src/index.ts`
- [ ] Add `@kubb/middleware-barrel` to `pnpm-workspace.yaml`
- [ ] Add changeset entries for `@kubb/core` and `@kubb/middleware-barrel`
