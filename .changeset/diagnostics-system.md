---
'@kubb/core': minor
'@kubb/adapter-oas': minor
'@kubb/cli': minor
'@kubb/mcp': minor
---

Give every build failure a stable, structured diagnostic instead of a plain error.

A `Diagnostic` carries a stable `code` (for example `KUBB_INPUT_NOT_FOUND`, `KUBB_REF_NOT_FOUND`, `KUBB_INVALID_PLUGIN_OPTIONS`), a `severity`, an optional source `location` (a JSON pointer), the `plugin` that raised it, and a suggested `fix`. `@kubb/core` exposes a `Diagnostics` class to work with them: `Diagnostics.report(...)` collects one into the active run instead of throwing, `Diagnostics.Error` is the throwable form for cases that must stop the build, and `Diagnostics.explain(code)`/`Diagnostics.docsUrl(code)` look up the catalog entry and its kubb.dev reference page. A plugin's `ctx.error`/`ctx.warn`/`ctx.info` now report through this same system, so a plugin-raised problem shows up in the run summary and JSON report like any other diagnostic, and `ctx.error` fails the build.

The CLI renders a diagnostic as `[CODE] plugin: message`, tinted by severity, with indented `at:`, `fix:`, and `see:` rows, and the end-of-run summary box gains an `Issues: N errors, M warnings` count. `kubb generate --reporter json` prints the same data as a stable, machine-readable report for CI. The OAS adapter's advisory diagnostics (`KUBB_UNSUPPORTED_FORMAT` for a schema whose `format` falls back to its base type, `KUBB_DEPRECATED` for a schema marked deprecated) run on every build. The MCP `generate` and `validate` tools return the same structured diagnostics, each with its code, source pointer, fix, and docs link, so an assistant can act on the exact problem instead of parsing a message string.
