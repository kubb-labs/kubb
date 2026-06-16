---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/mcp': patch
---

Render terminal diagnostics as a box-drawing tree instead of the oxlint glyph style.

A diagnostic now prints as `[CODE] plugin: message` with the code tinted by severity, followed by `├▶ at:`, `├▶ fix:`, and `╰▶ see:` rows (the last row uses `╰▶`). The `help:` and `docs:` labels are renamed to `fix:` and `see:`, matching the diagnostics docs pages. The `--reporter json` output and the `SerializedDiagnostic` fields (`help`, `docsUrl`) are unchanged.
