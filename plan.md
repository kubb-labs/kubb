# Plan: `@kubb/middleware-barrel`

## Problem

A middleware (or any third-party package) needs to inject extra fields into two places that currently have no awareness of it:

1. The root `Config` object (e.g. a top-level `barrel` option)
2. Every individual plugin's `options` object (e.g. a per-plugin `barrel` override)

Neither `Config` nor any plugin declares these fields today, so they must appear through TypeScript module augmentation — zero changes to core types.

---

## Solution: `Kubb.MiddlewareRegistry` global namespace

Add an empty, augmentable interface in `@kubb/core` that any package can extend. The `Config` and the per-plugin options base type each intersect with computed helpers that collect all registered fields.

### How it looks in `@kubb/core`

```ts
// packages/core/src/types.ts  (additions only)

declare global {
  namespace Kubb {
    /**
     * Middleware packages augment this interface to declare the fields they
     * inject into Config and into every plugin's options object.
     *
     * Each key is the middleware name; the value shape is:
     *   { configOptions?: { ... }; pluginOptions?: { ... } }
     */
    interface MiddlewareRegistry {}

    /**
     * Union → intersection of every `configOptions` contributed by registered middlewares.
     * Intersected into the root `Config` type.
     */
    type MiddlewareConfigOptions = MiddlewareRegistry extends Record<string, { configOptions?: infer O }>
      ? O
      : unknown

    /**
     * Union → intersection of every `pluginOptions` contributed by registered middlewares.
     * Intersected into every plugin's `options` type.
     */
    type MiddlewarePluginOptions = MiddlewareRegistry extends Record<string, { pluginOptions?: infer O }>
      ? O
      : unknown
  }
}

// Config gets the extra fields automatically:
export type Config = {
  // ... existing fields ...
} & Kubb.MiddlewareConfigOptions

// PluginFactoryOptions base also gets them:
export type PluginFactoryOptions<...> = {
  options: TOptions & Kubb.MiddlewarePluginOptions
  // ...
}
```

### How `@kubb/middleware-barrel` uses it

```ts
// packages/middleware-barrel/src/types.ts

declare global {
  namespace Kubb {
    interface MiddlewareRegistry {
      'middleware-barrel': {
        configOptions?: {
          /**
           * Barrel-file generation for the entire output.
           * Set to `false` to disable, or configure the type and output path.
           */
          barrel?:
            | { type?: 'all' | 'named' | 'propagate'; path?: string }
            | false
        }
        pluginOptions?: {
          /**
           * Override barrel-file generation for this specific plugin's output.
           * Inherits the root `barrel` setting when omitted.
           */
          barrel?:
            | { type?: 'all' | 'named' | 'propagate' }
            | false
        }
      }
    }
  }
}
```

After this augmentation TypeScript users automatically see:

```ts
import { defineConfig } from '@kubb/kubb'
import '@kubb/middleware-barrel'   // side-effect import — types only

export default defineConfig({
  barrel: { type: 'named' },        // ✅  autocompleted, type-checked
  plugins: [
    pluginTs({
      barrel: false,                // ✅  per-plugin override, also type-checked
    }),
  ],
})
```

Neither `defineConfig`, `Config`, nor `pluginTs` need to know about `barrel`.

---

## File-level changes

### `packages/core/src/types.ts`
- Add `declare global { namespace Kubb { interface MiddlewareRegistry {} … } }`
- Add `Kubb.MiddlewareConfigOptions` and `Kubb.MiddlewarePluginOptions` helpers
- Intersect `Config` with `Kubb.MiddlewareConfigOptions`
- Intersect the `options` field inside `PluginFactoryOptions` with `Kubb.MiddlewarePluginOptions`

### `packages/core/src/index.ts`
- No new exports required; the global namespace is self-registering

### `packages/middleware-barrel/` (new package)
| File | Purpose |
|---|---|
| `package.json` | `name: "@kubb/middleware-barrel"`, depends on `@kubb/core` |
| `tsconfig.json` | Mirrors other packages |
| `src/types.ts` | `MiddlewareRegistry` augmentation (barrel config + plugin option shapes) |
| `src/middleware.ts` | `defineMiddleware` call — exports `barrelMiddleware` runtime object |
| `src/index.ts` | Re-exports `barrelMiddleware` and types |

### `packages/kubb/src/defineConfig.ts` *(optional convenience)*
- When `barrel` is present in `config` or any plugin option, auto-append `barrelMiddleware` to the middleware list so users don't have to do it manually.

---

## Key design properties

| Concern | Owner |
|---|---|
| `MiddlewareRegistry` type augmentation mechanism | `@kubb/core` |
| Barrel-specific types (augmentation + barrel shapes) | `@kubb/middleware-barrel` |
| Barrel runtime logic (file generation, `TreeNode`, etc.) | `@kubb/middleware-barrel` |
| Auto-injection of barrel middleware | `@kubb/kubb/defineConfig.ts` (optional) |
| Individual plugins | **zero changes** |
| Root `Config` | **zero explicit barrel fields** |

---

## Checklist

- [ ] Add `Kubb.MiddlewareRegistry` + computed helpers to `packages/core/src/types.ts`
- [ ] Intersect `Config` with `Kubb.MiddlewareConfigOptions`
- [ ] Intersect plugin `options` base with `Kubb.MiddlewarePluginOptions`
- [ ] Scaffold `packages/middleware-barrel/` (package.json, tsconfig.json, src/)
- [ ] Add `MiddlewareRegistry` augmentation in `middleware-barrel/src/types.ts`
- [ ] Implement `barrelMiddleware` runtime in `middleware-barrel/src/middleware.ts`
- [ ] Export from `middleware-barrel/src/index.ts`
- [ ] Add `@kubb/middleware-barrel` to `pnpm-workspace.yaml` and root `package.json` if needed
- [ ] (Optional) Auto-inject `barrelMiddleware` in `defineConfig` when `barrel` option is detected
- [ ] Add changeset entry
