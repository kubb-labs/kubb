---
'@kubb/core': minor
'@kubb/kit': minor
---

Walk each schema and operation once, then fan every node out to all plugins.

`#runGenerators` looped plugin-outer, so it re-traversed the shared `schemas` and `operations` arrays once per plugin and paid the macro and option resolution walk `plugins × nodes` times. The loop is now node-outer: each schema is visited once and each operation once, and the node runs through the matching generators of every plugin in dependency order.

Each node carries a `NodeCache`, a per-node object shared by every plugin that generates from it, so work derived only from the node is filled once and read by the rest. Generators reach it through `ctx.cache`, and the type is exported from `@kubb/core` and `@kubb/kit`.

Output is unchanged. Schemas still run before operations, plugins still run in dependency order, each plugin's macros and its include, exclude, and override filters still apply before its generators run, and the `operations` batch still fires once per plugin after the operation walk.
