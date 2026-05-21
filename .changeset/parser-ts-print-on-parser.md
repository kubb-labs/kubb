---
'@kubb/core': minor
'@kubb/parser-ts': major
---

Expose `print` on `parserTs` and `parserTsx`, slim `@kubb/parser-ts` public API to just those two parsers.

`Parser` (from `@kubb/core`) now requires a `print(...nodes): string` method that renders compiler AST nodes for the parser's language. The TypeScript and TSX parsers implement it via `parserTs.print(...)` / `parserTsx.print(...)`.

`@kubb/parser-ts` no longer re-exports the standalone helpers `print`, `safePrint`, `createImport`, `createExport`, or `validateNodes`. Plugins that depended on `print` / `safePrint` should call `parserTs.print(...)` instead. Custom parsers built with `defineParser` need to add a `print` implementation matching their AST node shape.
