---
'@kubb/adapter-oas': minor
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/mcp': minor
---

Extend diagnostics so more failures are coded, configurable, and visible.

Coded errors that used to surface as `KUBB_UNKNOWN`: a missing Studio adapter
(`KUBB_ADAPTER_REQUIRED`), a non-object `devtools` config (`KUBB_DEVTOOLS_INVALID`), and a
resolved path escaping the output directory (`KUBB_PATH_TRAVERSAL`). The OAS adapter checks
the input file before reading it in both generation and `validate`, so a missing spec reports
`KUBB_INPUT_NOT_FOUND` (the MCP `validate` tool returns the coded diagnostic too).

The formatter, linter, and post-generate hooks now report failures as diagnostics
(`KUBB_FORMAT_FAILED`, `KUBB_LINT_FAILED`, `KUBB_HOOK_FAILED`). They appear in the run summary
and `kubb generate --reporter json`, and a failure marks the run as failed instead of being
swallowed.

Adds `config.diagnostics.levels` to re-level or silence diagnostics by code: map a code to
`'error'`, `'warning'`, or `'info'` to change its severity, or to `'off'` to drop it. `timing`
diagnostics are never affected. `@kubb/core` exposes `Diagnostics.applyLevels` and the
`DiagnosticLevels` type.
