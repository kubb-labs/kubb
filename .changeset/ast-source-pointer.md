---
'@kubb/ast': patch
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/renderer-jsx': patch
---

AST nodes and generated sources now carry a `pointer` to the spec key they came from. Override it with the new `pointer` prop on `File.Source`.

Diagnostics and crash sites now point at the exact key, including renamed schemas and `oneOf` or `anyOf` members.

Unsupported formats and deprecated schemas inside parameters, request bodies and responses are now reported.
