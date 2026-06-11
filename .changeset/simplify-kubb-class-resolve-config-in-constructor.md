---
"@kubb/core": patch
"unplugin-kubb": patch
---

Resolve config in the `Kubb` constructor instead of `setup()`. `config` is now a plain readonly property available right after `createKubb`, so the getter no longer throws before `setup()`. `setup()` keeps the async work: sizing the hooks ceiling, the `output.clean` storage clear, and `driver.setup()`. The dead `kubb.config ?? userConfig` fallback in `unplugin-kubb` is removed.
