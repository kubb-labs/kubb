---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/mcp': patch
---

Lead terminal diagnostics with the code and rename the help/docs labels.

A diagnostic now prints as `[CODE] plugin: message` with the code tinted by severity, followed by indented `at:`, `fix:`, and `see:` rows. The `help:` and `docs:` labels are renamed to `fix:` and `see:`, matching the diagnostics docs pages, and the standalone `×`/`⚠`/`ℹ` glyph is dropped. The `--reporter json` output and the `SerializedDiagnostic` fields (`help`, `docsUrl`) are unchanged.
