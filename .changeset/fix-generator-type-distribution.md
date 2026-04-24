---
"@kubb/plugin-oas": patch
---

Fix `Generator` type so it accepts version-specific generators (e.g. `ReactGenerator<PluginTs, '1'>`) when used as `Generator<PluginTs>`. The type now distributes over `Version`, avoiding contravariance failures on the inner `OperationsProps`/`OperationProps`/`SchemaProps` function arguments.
