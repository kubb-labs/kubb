---
'@kubb/adapter-oas': patch
---

`datetime` schema nodes always set both `offset` and `local`, and circular schemas are found through the shared `@kubb/ast` graph.
