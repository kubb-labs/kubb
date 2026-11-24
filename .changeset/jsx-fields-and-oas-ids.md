---
'@kubb/adapter-oas': patch
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/parser-ts': patch
'@kubb/plugin-barrel': patch
'@kubb/renderer-jsx': patch
---

Read deprecated source flags the same way everywhere, and keep generated names apart.

- `@kubb/adapter-oas`: an operation whose `operationId` is already taken, declared or generated from the path, gets a `_2`, `_3`, … suffix and a `KUBB_DUPLICATE_OPERATION_ID` warning. Before, `/a-b` and `/a/b` both became `get_a-b` and overwrote each other. In a 2.0 or 3.0 document, a sibling `enum` on a union adds `null` only when the schema is nullable.
- `@kubb/ast`: `ast.file.isExported(source)` reads `export`, then the deprecated `isIndexable` and `isExportable`. `combineSources` uses it, so a source marked `isIndexable` dedupes against the same source marked `export`.
- `@kubb/core`: add the `KUBB_DUPLICATE_OPERATION_ID` diagnostic code.
- `@kubb/parser-ts`: a namespace alias that starts with a digit gets a `_` prefix and keeps the digit, so `1pets` prints as `_1pets` instead of `_pets`.
- `@kubb/plugin-barrel`: a source marked only with the deprecated `isExportable` is listed in barrels, like one marked `export`.
- `@kubb/renderer-jsx`: `Code` and `File.Source` leave `isTypeOnly` unset when it is not given, so a `Type` child makes the source type-only. `File.Source` reads `isExportable` as `export`.
