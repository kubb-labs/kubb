---
'@kubb/parser-ts': minor
---

`parserTs` and `parserTsx` inline sources themselves, through the `inline(files)` hook. The hook also carries `replaceIdentifiers` and `wrap`, so an older `@kubb/core` still inlines these files. A type used more than once, and any value that is not a bare name, becomes one local declaration per file instead of repeating it. A type that refers to itself now inlines too. Only free references are renamed, so parameters, locals and `{ petSchema }` keys stay as they are.
