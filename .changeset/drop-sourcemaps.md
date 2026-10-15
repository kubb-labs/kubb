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

Stop shipping sourcemaps in `dist`. They made up about half of each package, so installs are about 50% smaller. The JavaScript and type declarations are unchanged.
