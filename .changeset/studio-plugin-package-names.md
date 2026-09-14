---
'@kubb/studio': patch
---

Report the package a plugin ships from, so `plugin-ts` reaches Studio as `@kubb/plugin-ts` while a third-party plugin keeps its own name.

The connect payload scoped every plugin name under `@kubb/`, which claimed a third-party plugin as one of Kubb's. It now follows the same rule the dependency check already used.
