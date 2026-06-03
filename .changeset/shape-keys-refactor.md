---
"@kubb/ast": patch
---

Replace the `describeShape` switch with a `SHAPE_KEYS` registry.

Internal refactor only, no public API changes. Replaces the 12-case switch statement in `describeShape` with a declarative `SHAPE_KEYS` registry (same pattern as `VISITOR_KEYS` in visitor.ts). Output is byte-for-byte identical.
