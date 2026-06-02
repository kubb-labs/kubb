---
'@kubb/adapter-oas': minor
'@kubb/core': minor
'@kubb/mcp': minor
'@kubb/cli': minor
---

Give every error a stable code, and hand structured diagnostics to the MCP tools.

Three failures that used to throw a plain `Error` now throw a `DiagnosticError` with a code, a `config` location, and a help line: an unreadable `input.path` reports `KUBB_INPUT_NOT_FOUND`, an adapter configured without input reports `KUBB_INPUT_REQUIRED`, and merging an empty set of OAS documents reports `KUBB_INPUT_REQUIRED`. They surface in the run summary and `--reporter json` instead of as an opaque `KUBB_UNKNOWN`.

`@kubb/core` exports `diagnosticDocsUrl(code)` and `Diagnostics.serialize(diagnostic)`, the JSON-safe shape (now including a `docsUrl`) shared by the JSON reporter and the MCP tools. The CLI's `diagnosticDocsUrl` is re-exported from core so both track the same major.

The MCP `generate` and `validate` tools now return structured diagnostics, each with its code, source pointer, help, and docs link, as a readable block plus a JSON payload, so an assistant can act on the exact problem rather than parsing a message string.
