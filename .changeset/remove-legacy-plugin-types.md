---
"@kubb/core": minor
---

Remove legacy plugin infrastructure now that all plugins use `definePlugin`.

### Removed types

- `NormalizedPlugin` — internal plugin state is no longer part of the public API. Use `Plugin` for all external-facing plugin references.
- `PluginContext` — replaced by the standalone `GeneratorContext` type.
- `SchemaHook`, `OperationHook`, `OperationsHook` — unused hook type aliases.

### Renamed types

- The internal `InternalPlugin` type (never public) was renamed to `NormalizedPlugin` for clarity, but this type is marked `@internal` and should not be used by plugin authors.

### Improved types

- `ResolveOptionsContext` — marked `@internal`.
- `FileMetaBase` — marked `@internal`.
- `FileProcessor` — marked `@internal`.
- `PluginDriver.registerPluginHooks` — marked `@internal`.
- `PluginDriver.dispose` — marked `@internal`.
- `PluginDriver` constructor now requires `hooks` (was optional but always threw when absent).
- `InternalPlugin` (now `NormalizedPlugin`) moved from `PluginDriver.ts` to `types.ts` with proper root-level imports.

### Migration

If you were importing `NormalizedPlugin` or `PluginContext` from `@kubb/core`, switch to `Plugin` and `GeneratorContext` respectively:

```ts
// Before
import type { NormalizedPlugin, PluginContext } from '@kubb/core'

// After
import type { Plugin, GeneratorContext } from '@kubb/core'
```
