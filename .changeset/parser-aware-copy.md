---
'@kubb/core': patch
'@kubb/parser-ts': patch
---

Runtime templates emitted with `copy` now follow the parser's `extension` option. `Parser` gains an optional `parseCopy(file, source)` hook that `FileManager` calls with the copied content before applying `banner`/`footer`. `parserTs` and `parserTsx` implement it by rewriting relative `.ts`/`.tsx`/`.js`/`.jsx` import and export specifiers with the same rule as generated imports, so a template authored with `from './serializers.ts'` is emitted as `./serializers` by default, `./serializers.ts` with `parserTs({ extension: { '.ts': '.ts' } })`, and `./serializers.js` with `{ '.ts': '.js' }`. Parsers without the hook still copy the file verbatim.
