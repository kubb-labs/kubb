# Step 7: Deprecate Legacy API and Clean Up

## Goal

After all built-in plugins are migrated, deprecate the old API surface and internalize preset utilities. This is the final cleanup step.

## Depends On

- Step 6 (all built-in plugins migrated)

## Scope

- `packages/core/src/index.ts` — deprecation markers on exports
- `packages/core/src/createPlugin.ts` — `@deprecated` annotation
- `packages/core/src/definePresets.ts` — mark as `@internal`
- Various files — JSDoc deprecation notices
- Documentation — migration guide

## What Changes

### Phase A: Deprecate (non-breaking)

Add `@deprecated` JSDoc to old API functions. They continue to work but show warnings:

```ts
/**
 * @deprecated Use `definePlugin` instead. See migration guide.
 */
export function createPlugin<T>(factory: PluginFactory<T>): Plugin<T> {
  // unchanged implementation
}
```

Runtime deprecation warning (once per plugin):

```ts
function createPlugin(factory) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[kubb] createPlugin() is deprecated. Use definePlugin() instead. ` +
      `See https://kubb.dev/migration/define-plugin`
    )
  }
  // ...
}
```

### Phase B: Internalize preset utilities

These functions are no longer needed in the public API:

```ts
// Mark as @internal — still usable but not in public docs
/** @internal */
export function definePresets() { ... }

/** @internal */  
export function getPreset() { ... }

/** @internal */
export function mergeGenerators() { ... }
```

### Phase C: Remove (breaking — next major)

In the next major version:
- Remove `createPlugin`
- Remove `definePresets`, `getPreset`, `mergeGenerators` from public exports
- Remove `pre`/`post` support (only `dependencies`)
- Remove `this`-based generator support

## Documentation

Create a migration guide at `docs/migration/define-plugin.md`:

1. **Rename** `createPlugin` → `definePlugin`
2. **Move** `schema()`/`operation()` into generators registered via `addGenerator()`
3. **Replace** `get resolver()` with `setResolver()` in `kubb:setup`
4. **Replace** `pre`/`post` with `dependencies`
5. **Update** generator signatures: `schema(this, node, opts)` → `schema(node, ctx)`
6. **Remove** preset files — logic moves inline to setup hook

Include before/after code examples for each plugin type (simple, medium, complex).

## Config rename (optional)

If decided, rename `plugins` → `integrations` in config:

```ts
// Both work during transition
export default defineConfig({
  plugins: [pluginTs()],      // still works
  integrations: [pluginTs()], // new name
})
```

## Acceptance Criteria

- [ ] `createPlugin` marked as `@deprecated` with runtime warning
- [ ] `definePresets`, `getPreset`, `mergeGenerators` marked as `@internal`
- [ ] Migration guide written with before/after for each plugin type
- [ ] All existing third-party plugins using `createPlugin` still work (just show warning)
- [ ] No functional changes — purely additive deprecation markers

## Size Estimate

~50-100 lines of deprecation annotations + migration guide document.
