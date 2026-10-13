---
'@kubb/core': minor
---

Remove the `PluginType` alias (use `PluginFactoryOptions`), `KubbDriver.dispatch` (use `driver.fileManager.dispatch`) and `KubbDriver.hasHookGenerators`. The `file` reporter now prints the same summary as the cli reporter, with timings under `## Summary`.
