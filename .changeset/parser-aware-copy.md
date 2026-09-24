---
'@kubb/core': patch
'@kubb/parser-ts': patch
---

Runtime templates emitted with `copy` now follow the parser's `extension` option. `Parser` gains an optional `copy(file, source)` hook that turns the copied content into nodes, and `FileManager` prints the result with the same `parse` it uses for every other file. `parserTs` and `parserTsx` implement it by lifting the template's top-level `import` and `export … from` declarations into `ImportNode`/`ExportNode`s, so a template authored with `from './serializers.ts'` is emitted as `./serializers` by default, `./serializers.ts` with `parserTs({ extension: { '.ts': '.ts' } })`, and `./serializers.js` with `{ '.ts': '.js' }`. Parsers without the hook still copy the file verbatim.
