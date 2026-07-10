---
'@kubb/plugin-barrel': patch
---

Honor `barrelType: 'named'` when generating nested barrels.

With `{ type: 'named', nested: true }` the nested walk emitted a wildcard `export *` for every file, so leaf modules were re-exported by wildcard instead of by their named symbols. Nested barrels now apply the named strategy to leaf files and only chain a sub-directory barrel that actually produced output, so an empty sub-directory no longer leaves a dangling `export * from './sub'`.
