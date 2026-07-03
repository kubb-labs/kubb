---
'@kubb/core': patch
---

Order plugins with a topological sort instead of a pairwise comparator.

The previous `Array.sort` comparator checked dependencies pairwise, which is not transitive: in a chain where A depends on B and B depends on C, A and C may never be compared directly, so the order could come out wrong depending on declaration order. Plugins are now sorted with Kahn's algorithm, with `enforce` (`pre` before normal before `post`) and declaration order as tiebreaks, and a dependency cycle now fails setup with a `KUBB_INVALID_PLUGIN_OPTIONS` diagnostic naming the plugins in the cycle.
