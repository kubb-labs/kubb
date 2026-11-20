---
'@kubb/core': patch
---

Add plugin visit hooks: `kubb:plugin:visit:start`, `kubb:plugin:visit:schema`, `kubb:plugin:visit:operation` and `kubb:plugin:visit:end`. Kubb calls them for one plugin while it walks the input, in the same order as generators, and they never reach the shared hooks bus. `getResolver` now reads a resolver stored in memo under `<plugin>:resolver` before `plugin.resolver`, and the build memo holds the shared-schema data under `kubb:sharedSchemas`.
