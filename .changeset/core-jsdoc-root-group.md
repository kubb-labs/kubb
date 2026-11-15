---
'@kubb/core': patch
---

Fix three JSDoc comments to match the code. `GeneratorContext.root` is the build's output directory, the same for every plugin, not the current plugin's folder. The default `group.name` for `path` groups camelCases the first path segment. `Adapter.sources` no longer claims that a watcher rebuilds from it: `kubb generate --watch` watches only `input`.
