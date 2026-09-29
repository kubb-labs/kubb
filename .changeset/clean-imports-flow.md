---
'@kubb/core': minor
---

Add `output.imports` to plugin output options so generated files can declare package imports that are deduplicated and pruned when unused. Allow `resolver.imports` to be overridden through `ResolverPatch` without a cast.
