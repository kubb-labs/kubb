---
'@kubb/adapter-oas': patch
'@kubb/agent': patch
'@kubb/ast': patch
'@kubb/cli': patch
'@kubb/core': patch
'kubb': patch
'@kubb/mcp': patch
'@kubb/middleware-barrel': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/renderer-jsx': patch
'unplugin-kubb': patch
---

Enforce `Array<T>` syntax (over `T[]`) via the oxlint `typescript/array-type` rule. Internal-only change, no runtime or API impact.
