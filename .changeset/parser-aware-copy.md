---
'@kubb/core': patch
'@kubb/parser-ts': patch
---

Runtime templates emitted with `copy` now follow the parser's `extension` option. `Parser` gains an optional `copy(file, source)` hook that describes the copied content as a `UserFileNode`, the same shape `injectFile` takes, and `FileManager` builds it with `createFile` and prints it with `parse` like any other file. `parserTs` and `parserTsx` lift the template's top-level `import` and `export … from` statements into import and export nodes, so `from './serializers.ts'` is emitted as `./serializers`, `./serializers.ts` or `./serializers.js` depending on `extension`. Parsers without the hook still copy the file verbatim.
