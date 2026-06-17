---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/adapter-oas': patch
'@kubb/cli': patch
'@kubb/mcp': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
'kubb': patch
'unplugin-kubb': patch
---

Stop publishing `src/` in the package tarballs.

The shipped sourcemaps already embed their sources and no declaration maps point at `src/`, so source-level debugging and go-to-definition are unaffected while each tarball drops by roughly a third.
