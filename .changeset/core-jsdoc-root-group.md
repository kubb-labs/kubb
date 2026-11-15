---
'@kubb/core': patch
---

Fix two JSDoc comments to match the code. `GeneratorContext.root` is the build's output directory, the same for every plugin, not the current plugin's folder. The default `group.name` for `path` groups camelCases the first path segment.
