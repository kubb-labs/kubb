---
'@kubb/parser-ts': patch
---

Load `typescript` with `require` instead of `import`. When ESM code imports a CommonJS package, Node keeps a second copy of its source, and for TypeScript that copy is about 9 MB. With `plugin-ts` and `plugin-zod` loaded, heap drops by about 9 MB and RSS by about 25 MB, which matters most for the long-running `kubb studio` agent.
