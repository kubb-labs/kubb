---
'@kubb/ast': minor
---

Introduce `defineNode` as the single source-of-truth for AST nodes.

Each node is now defined once in its `nodes/*.ts` file with `defineNode`, which derives its `create` builder, its `is*` guard, and the visitor traversal tables (`VISITOR_KEYS`, `VISITOR_KEY_BY_KIND`, `nodeFinalizers`) from that one definition. `factory.ts` and `guards.ts` became thin re-export barrels, the hand-maintained visitor tables moved to a generated `registry.ts`, and the node-shape `as` casts in `factory.ts` are gone.

This is non-breaking: every existing export keeps its shape and behavior, and the generated output is unchanged. It also adds an `is*` guard for every node kind (24 in total), so `isContentNode`, `isPropertyNode`, `isFileNode`, `isTextNode`, and the rest are now available alongside the existing guards.
