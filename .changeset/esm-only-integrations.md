---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/kit': patch
'kubb': patch
'@kubb/mcp': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
'@kubb/studio': patch
'unplugin-kubb': patch
---

Require Node.js 22.12 or higher, the first 22.x release that can `require()` ES modules.

`unplugin-kubb` and the bundler integrations in `kubb` (`kubb/vite`, `kubb/webpack`, `kubb/rspack`, and the others) now ship as ES modules only. Their dependencies, such as Vite, Rolldown, and unplugin, are ES modules only, so the CommonJS types could not resolve them, and the `unplugin-kubb/nuxt` CommonJS types had the wrong default export. CommonJS code still loads these entries through `require()`, but `require('unplugin-kubb/vite')` now returns the module, so read the plugin from `.default`.

The test helpers `@kubb/core/mocks`, `@kubb/kit/testing`, and `kubb/kit/testing` also ship as ES modules only, since they import Vitest, which cannot be loaded with `require()`.
