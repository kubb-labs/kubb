---
'@kubb/core': minor
---

Add typed `GeneratorContext<TOptions>` so generators receive `adapter` and `rootNode` via a typed `this` context. Add `mergeGenerators(generators)` to combine multiple generators. Plugins augment `Kubb.PluginRegistry` for automatic typing in `getPlugin`.

Renamed hooks: `renderHookResult` → `applyHookResult`, `install` → `buildStart`. New `buildEnd` hook runs after all files are written.
