---
'@kubb/ast': minor
---

Introduce `defineNode` as the single source-of-truth for AST nodes.

Each node is now defined once in its `nodes/*.ts` file with `defineNode`, which derives its `create` builder, its `is*` guard, and the visitor traversal tables (`VISITOR_KEYS`, `VISITOR_KEY_BY_KIND`, `nodeFinalizers`) from that one definition. The public API is re-exported from `index.ts` straight from each node file, the hand-maintained visitor tables moved to a generated `registry.ts`, and the node-shape `as` casts are gone. `factory.ts` now holds only `createFile` and `update`.

This is non-breaking: every existing export keeps its shape and behavior, and the generated output is unchanged. It also adds an `is*` guard for every node kind (24 in total), so `isContentNode`, `isPropertyNode`, `isFileNode`, `isTextNode`, and the rest are now available alongside the existing guards.

The per-node definitions (`schemaDef`, `propertyDef`, …) and `defineNode` are now exported. The standalone `is*` guards are deprecated in favor of each node's `<node>Def.is` (for example `schemaDef.is` over `isSchemaNode`), which keeps the guard next to the node it belongs to.
