---
"@kubb/parser-ts": minor
"@kubb/ast": minor
---

Emit imports and exports in the repo style so generated files read cleanly before any formatter runs. `@kubb/parser-ts` now prints `import`/`export` statements with single quotes and no semicolons through new `printImport`/`printExport` builders instead of the TypeScript compiler printer. `@kubb/ast` gains shared string builders (`buildObject`, `buildList`, `objectKey`, `isValidIdentifier`) so plugins can assemble multi-line object and array literals with correct, cumulative indentation, a closing bracket at column zero, and trailing commas.
