---
'@kubb/core': minor
'@kubb/ast': patch
---

`Parser.inline` can now be a function, `(files) => InlineResult`, so each parser inlines its own files. Setting `inline` to an `InlineLanguage` object still works. That form, `InlineLanguage` and `ast.file.inline` are deprecated and will be removed in v6.
