---
'@kubb/core': patch
---

Add the plugin visit hooks `kubb:plugin:visit:start`, `kubb:plugin:visit:schema`, `kubb:plugin:visit:operation` and `kubb:plugin:visit:end`, which run for one plugin while Kubb walks the input.

- They never reach the shared hooks bus.
- The shared-schema data is in the build memo under `kubb:sharedSchemas`.
