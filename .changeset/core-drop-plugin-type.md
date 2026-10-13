---
'@kubb/core': minor
---

Rename `PluginFactoryOptions` to `PluginType`; the old name stays as a deprecated alias until the next major. Remove `KubbDriver.dispatch` (use `driver.fileManager.dispatch`) and `KubbDriver.hasHookGenerators`. The `file` reporter now prints the same summary as the cli reporter, with timings under `## Summary`.
