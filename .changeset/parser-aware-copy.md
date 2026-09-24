---
'@kubb/core': patch
'@kubb/parser-ts': patch
---

Files emitted with `copy` now follow the parser's `extension` option. Parsers can implement the new `copy(file, source)` hook to turn a copied file into nodes, and `parserTs`/`parserTsx` use it to lift a template's imports and exports into import and export nodes.
