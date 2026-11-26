---
'@kubb/mcp': minor
---

Add `diff`, `add`, `update`, `remove`, and `list` tools to the MCP server, so an AI client can run every `kubb` command except `studio`.

- `diff` runs `kubb generate --diff` and returns a unified diff for each out-of-date file, without writing files.
- `add`, `update`, `remove`, and `list` manage extensions from the Kubb registry. They pass `--yes` and accept `dryRun`.

The new tools run the project's own `kubb` CLI, so `kubb` must be installed in the project.
