---
'@kubb/adapter-oas': patch
'@kubb/ast': minor
---

Fold schema diagnostics and circular detection into a single convert walk.

The adapter walked every freshly parsed schema twice: once to report the advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT`, `KUBB_DEPRECATED`), then again inside `findCircularSchemas` to collect the names each schema references. The diagnostics walk now gathers those names in the same pass, and circular detection reads that graph instead of sweeping the nodes again.

`@kubb/ast` gains `findCircularSchemasFromGraph`, which runs cycle detection over a pre-built name-to-refs graph. `findCircularSchemas` builds the graph and hands off to it, so both share one implementation. Generated output does not change.
