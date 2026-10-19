---
'@kubb/cli': patch
'@kubb/adapter-oas': patch
---

Fix config protection, diagnostic lookup, and generation summaries in the CLI.

- Ask before overwriting an existing config when `kubb init` receives all value flags without `--yes`.
- Keep diagnostics working for property names containing `%` and fall back when source lookup fails.
- Resolve validation inputs from the current directory when a config omits `root`.
- Show dry-run plans and unchanged file counts in plain terminal output.
- Compare generated files in batches to reduce memory use during reporting.
