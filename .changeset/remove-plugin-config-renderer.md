---
'@kubb/core': minor
---

Resolve the renderer from the generator only. The `renderer` resolution chain dropped the plugin and config fallbacks, so `generator.renderer` is now the single source.

Removed the `renderer` option from `defineConfig`, the `renderer` field from the normalized plugin, and the `setRenderer` method from the plugin setup context. Set `renderer` on each generator instead (`renderer: jsxRenderer`), or leave it unset / `renderer: null` to opt out of rendering.
