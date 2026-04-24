---
"@kubb/middleware-barrel": patch
---

Sort named re-exports alphabetically within each generated barrel export node so that `export { a, m, z }` is emitted instead of source-order. File-level export order was already alphabetical via the sorted directory tree.
