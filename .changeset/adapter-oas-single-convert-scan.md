---
'@kubb/adapter-oas': patch
'@kubb/ast': minor
---

Fold schema diagnostics and circular detection into a single convert walk.

The adapter used to sweep every freshly parsed schema three times: once to report the advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT`, `KUBB_DEPRECATED`), again to collect referenced names for `findCircularSchemas`, and the graph build itself. The diagnostics walk now also collects each schema's outbound refs, so circular detection reads the collected graph instead of walking the same nodes again.

Add `findCircularSchemasFromGraph` to `@kubb/ast`, which runs cycle detection over a pre-built name-to-refs graph. `findCircularSchemas` now builds the graph and delegates to it, so both share one implementation. Generated output is unchanged.
