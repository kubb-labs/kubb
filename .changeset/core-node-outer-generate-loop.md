---
'@kubb/core': minor
'@kubb/kit': minor
---

Walk each schema and operation once instead of once per plugin.

`#runGenerators` was plugin-outer, so it re-walked the shared `schemas` and `operations` arrays once for every plugin. It is now node-outer: each schema and each operation is visited once, then fanned out to the matching generators of every plugin in dependency order.

Each node also carries a `NodeCache`, shared by every plugin that generates from it and exposed to generators as `ctx.cache`, so node-derived work can be computed once and reused. The type is exported from `@kubb/core` and `@kubb/kit`.

The generated files are unchanged.
