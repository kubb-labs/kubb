---
'kubb': patch
'unplugin-kubb': patch
---

Move `@kubb/plugin-barrel` source to the `kubb-labs/plugins` repository. The npm package name, behavior, and API are unchanged. `kubb` and `unplugin-kubb` now reference the published package from the catalog rather than a workspace dependency.
