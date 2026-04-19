---
"@kubb/core": minor
---

`KubbBuildStartContext.getPlugin` now returns a typed `Plugin<Kubb.PluginRegistry[TName]>` when the name is a registered key in `Kubb.PluginRegistry`, making plugin access type-safe without manual casting.
