---
"@kubb/ast": minor
---

Reduce the files you touch to add a node.

`types.ts` now derives its node-type exports from the node barrel (`export type * from './nodes/index.ts'`) instead of a hand-maintained list, so adding a node no longer edits `types.ts`. This also surfaces five node types the old list had drifted from: `BreakNode`, `ContentNode`, `GenericOperationNode`, `RequestBodyNode`, and `ScalarSchemaNode`.

The `@kubb/ast` barrel now sources its node defs from the registry (`export * from './registry.ts'`), so adding a node no longer edits the barrel either. This surfaces `nodeDefs` on the barrel. The visitor tables it derives stay internal to `visitor.ts`.

A new test fails when a node def has no matching `factory.create*`, so missing wiring is caught in CI. The package README documents the remaining touch-points.
