---
"@kubb/ast": minor
---

Add `resolveOptions(node, context)` helper.

Returns effective plugin options for a node after applying `exclude`, `include`, and `override` rules. Returns `null` when the node is excluded.
