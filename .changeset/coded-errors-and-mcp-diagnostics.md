---
'@kubb/adapter-oas': minor
'@kubb/core': minor
'@kubb/mcp': minor
'@kubb/cli': minor
---

Give every error a stable code, and hand structured diagnostics to the MCP tools.

Failures that used to throw a plain `Error` now throw a `DiagnosticError` with a code, a `config` location, and a help line: a missing `input.path` reports `KUBB_INPUT_NOT_FOUND` (the OAS adapter checks the file before reading it), an adapter configured without input reports `KUBB_INPUT_REQUIRED`, and merging an empty set of OAS documents reports `KUBB_INPUT_REQUIRED`. They surface in the run summary and `--reporter json` instead of as an opaque `KUBB_UNKNOWN`. `Diagnostics.from` now recognizes a `DiagnosticError` structurally, so a code still survives when the error crosses a duplicated `@kubb/core` copy bundled into an adapter or plugin.

`@kubb/core` exposes `Diagnostics.docsUrl(code)` and `Diagnostics.serialize(diagnostic)`, the JSON-safe shape (now including a `docsUrl`) shared by the JSON reporter and the MCP tools.

The MCP `generate` and `validate` tools now return structured diagnostics, each with its code, source pointer, help, and docs link, as a readable block plus a JSON payload, so an assistant can act on the exact problem rather than parsing a message string.

`@kubb/adapter-oas` gains an opt-in `diagnostics` option that reports two advisory diagnostics against their JSON pointers as it parses: `KUBB_UNSUPPORTED_FORMAT` (a warning when a schema's `format` falls back to the base type) and `KUBB_DEPRECATED` (info for a schema marked `deprecated`). The checks reuse the nodes the parser already produces, so they add no extra traversal of the document. Both default to off, so existing output is unchanged unless you set `adapterOas({ diagnostics: { unsupportedFormat: true, deprecated: true } })`.
