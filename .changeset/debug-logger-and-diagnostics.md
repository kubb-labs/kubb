---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/adapter-oas': minor
---

Add a structured diagnostics model.

Build failures are collected as structured `Diagnostic`s instead of raw errors. Each has a stable `code`, a `severity`, an optional source `location` (a JSON pointer), and the `plugin` that produced it. `BuildOutput` now exposes a single `diagnostics` array (the former `error`, `failedPlugins`, and `pluginTimings` fields are gone), and the build emits each problem on the new `kubb:diagnostic` hook. Per-plugin timings are carried as `timing` diagnostics in the same array. `@kubb/core` exports `hasBuildError` and `getFailedPluginNames` to read them. Three throw sites carry codes: `KUBB_REF_NOT_FOUND`, `KUBB_INVALID_SERVER_VARIABLE`, and `KUBB_PLUGIN_NOT_FOUND`.
