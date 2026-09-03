---
'@kubb/adapter-oas': patch
'@kubb/parser-md': patch
'@kubb/kit': patch
'@kubb/plugin-barrel': patch
'unplugin-kubb': patch
'kubb': patch
'@kubb/renderer-jsx': patch
'@kubb/cli': patch
'@kubb/ast': patch
'@kubb/parser-ts': patch
'@kubb/core': patch
'@kubb/mcp': patch
---

Explicit `types` fields for each package.json `exports` entry, so that it works with tsconfig.json `moduleResolution: 'bundler'`
