---
'@kubb/mcp': minor
---

Add `kubb_diff`, `kubb_add`, `kubb_update`, `kubb_remove`, and `kubb_list` tools to the MCP server, so an AI client can run every `kubb` command except `studio`.

- `kubb_diff` runs `kubb generate --diff` and returns a unified diff for each out-of-date file, without writing files.
- `kubb_add`, `kubb_update`, `kubb_remove`, and `kubb_list` manage extensions from the Kubb registry. `kubb_add`, `kubb_update`, and `kubb_remove` pass `--yes` and accept `dryRun`.

The new tools run the project's own `kubb` CLI, or the one that started the server when the project has none.
