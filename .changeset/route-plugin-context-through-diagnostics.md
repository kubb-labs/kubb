---
'@kubb/core': minor
---

Route the generator context's `warn`/`error`/`info` through the diagnostics layer so plugin-reported problems are collected like every other diagnostic.

Until now these methods only emitted `kubb:warn`/`kubb:error`/`kubb:info` events, so a plugin calling `ctx.error(...)` logged a line but the build still succeeded, and the message never reached the run summary or `--reporter json`. They now report into the active run via `Diagnostics.report` (attributed to the plugin) while still emitting their hook event:

- `ctx.error` reports an `error` diagnostic (`KUBB_PLUGIN_FAILED`), which now **fails the build**. When passed an `Error`, it is kept as the diagnostic `cause`.
- `ctx.warn` reports a `warning` (`KUBB_PLUGIN_WARNING`); `ctx.info` reports an `info` (`KUBB_PLUGIN_INFO`). Neither fails the build.

Adds `ctx.report(diagnostic)` for the structured path: pass a stable `code`, `severity`, and an optional source `location`/`help` to point a diagnostic at a `$ref` or operation instead of logging a bare string. The `Diagnostic`, `DiagnosticSeverity`, `DiagnosticLocation`, and `DiagnosticKind` types are now exported.
