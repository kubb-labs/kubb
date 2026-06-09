---
"@kubb/parser-ts": minor
"@kubb/ast": minor
---

Emit imports and exports in the repo style so generated files read cleanly before any formatter runs. `@kubb/parser-ts` now prints `import`/`export` statements with single quotes and no semicolons through new `printImport`/`printExport` builders instead of the TypeScript compiler printer. `@kubb/ast` gains shared string primitives (`buildObject`, `objectKey`, `isValidIdentifier`, `indentLines`) so plugins can assemble multi-line object literals with correct, cumulative indentation and a closing brace at column zero.
