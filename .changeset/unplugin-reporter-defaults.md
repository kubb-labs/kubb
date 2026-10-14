---
'unplugin-kubb': patch
---

Report builds the same way `kubb generate` does and apply the same config defaults.

- Print the `kubb generate` summary after a build instead of one console line per hook.
- Apply the `defineConfig` defaults (`parserMd`, built-in reporters, `root`) and export them as `applyDefaults`.
- Remove the `unplugin-kubb/types` and `unplugin-kubb/unpluginFactory` subpaths. `Options` and `unpluginFactory` stay on the package root.
- Stop re-exporting `BarrelType`; import it from `kubb` or `@kubb/plugin-barrel`.
