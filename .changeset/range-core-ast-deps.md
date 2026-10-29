---
'@kubb/adapter-oas': patch
'@kubb/cli': patch
'@kubb/core': patch
'@kubb/kit': patch
'@kubb/mcp': patch
'@kubb/parser-md': patch
'@kubb/parser-ts': patch
'@kubb/renderer-jsx': patch
'@kubb/studio': patch
'kubb': patch
'unplugin-kubb': patch
---

Publish dependencies on `@kubb/core` and `@kubb/ast` as caret ranges instead of exact versions. A plugin that pulls in a newer `@kubb/parser-ts`, `@kubb/kit`, or `@kubb/renderer-jsx` can now share the project's `@kubb/core` and `@kubb/ast` when the project's version is the same or newer, instead of installing a second copy.
