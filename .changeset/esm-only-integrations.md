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
Require Node.js 22.12 or higher. `unplugin-kubb`, the bundler integrations in `kubb` (`kubb/vite`, `kubb/webpack`, and the others), and the test helpers (`@kubb/core/mocks`, `@kubb/kit/testing`, `kubb/kit/testing`) now ship as ES modules only. From CommonJS, read the plugin from `.default`: `require('unplugin-kubb/vite').default`.
