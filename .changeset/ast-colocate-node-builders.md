---
'@kubb/ast': patch
---

Colocate the node builders with their definitions. `createFile` now lives in `nodes/file.ts` alongside the other `createX` helpers, the per-node factory tests sit next to each node module, and the `node.ts`/`printer.ts` modules are renamed to `defineNode.ts`/`definePrinter.ts` to match their exports. Public API and generated output are unchanged.
