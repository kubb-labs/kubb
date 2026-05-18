---
"@kubb/core": minor
---

Remove legacy plugin types `NormalizedPlugin`, `PluginContext`, `SchemaHook`, `OperationHook`, and `OperationsHook` from the public API. Use `Plugin` and `GeneratorContext` instead.

`PluginDriver` constructor now requires `hooks`. Several internal types are marked `@internal`.
