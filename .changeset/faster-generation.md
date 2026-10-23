---
'@kubb/ast': patch
'@kubb/core': patch
'@kubb/parser-ts': patch
---

Speed up generation without changing the output. `collectSync` walks the tree without nested generators, `mergeRefWithSchema` stops building throwaway objects, and `resolver.imports` resolves each import path without building a full file node. Merging many fragments into one file, as `output.mode: 'file'` does, no longer copies every fragment and import name merged so far. On large specs this cuts build time by about 8% in directory mode and about 20% in single-file mode.
