---
'@kubb/core': minor
'@kubb/ast': patch
---

Add the `Parser.inlineFiles(files)` hook, so each parser inlines its own files. `Parser.inline`, `InlineLanguage` and `ast.file.inline` are deprecated and will be removed in v6.
