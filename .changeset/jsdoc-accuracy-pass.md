---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/mcp': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/renderer-jsx': patch
'unplugin-kubb': patch
---

Review JSDoc and code comments across these packages so the shipped docs match the current code. The pass corrects stale claims (a `PluginDriver` reference that is now `KubbDriver`, a reversed formatter-detection order, a `--debug` flag that no longer exists, lowercase HTTP methods that are actually uppercase) and removes unverifiable assertions. Comments only, no code or generated output changes.
