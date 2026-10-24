---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/renderer-jsx': patch
---

AST nodes and diagnostics point at the spec key they came from, with a new `pointer` prop on `File.Source`.
