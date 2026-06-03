---
'@kubb/core': minor
---

Route the generator context's `warn`/`error`/`info` through the diagnostics layer so plugin-reported problems are collected like every other diagnostic.

Until now these methods only emitted `kubb:warn`/`kubb:error`/`kubb:info` events, so a plugin calling `ctx.error(...)` logged a line but the build still succeeded, and the message never reached the run summary or `--reporter json`. They now report into the active run via `Diagnostics.report` (attributed to the plugin) while still emitting their hook event:

- `ctx.error` reports an `error` diagnostic (`KUBB_PLUGIN_FAILED`), which now fails the build. When passed an `Error`, it is kept as the diagnostic `cause`.
- `ctx.warn` reports a `warning` (`KUBB_PLUGIN_WARNING`), and `ctx.info` reports an `info` (`KUBB_PLUGIN_INFO`). Neither fails the build.

For a structured diagnostic with a stable `code` and a source `location`, call `Diagnostics.report(...)` or throw a `DiagnosticError` directly. The `Diagnostic`, `DiagnosticSeverity`, `DiagnosticLocation`, and `DiagnosticKind` types are now exported so you can build one.
