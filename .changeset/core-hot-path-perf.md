---
'@kubb/core': patch
---

Cut memory use and duplicated work in the build hot path, and name the requiring plugin in missing-dependency errors.

Rendered sources are no longer retained in memory for the whole build when caching is disabled, and the file write pipeline streams each file to storage as soon as it is parsed instead of materializing the entire batch first. Cache-hit restores now write files in parallel batches instead of one at a time. Per-node transformer results are memoized per plugin, so a plugin with a batch `operations()` generator no longer transforms and re-resolves every operation twice.

`requirePlugin` errors raised from a generator context now say which plugin declared the missing dependency, e.g. `Plugin "plugin-zod" is required by "plugin-ts" but not found`.
