---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/adapter-oas': minor
'@kubb/mcp': minor
---

Diagnostics now say why a build failed and how to fix it, without a trip to kubb.dev:

- Every problem shows a `fix:`, falling back to the catalog fix when it has no `help` of its own. The `--reporter json` output and the MCP tools also add the catalog `title` and `cause`, a `causes` list with each underlying error, and the root `stack` for a crash. The `file` reporter appends that stack too.
- The CLI prints `caused by:` for every error in the cause chain, and the error name plus where it was thrown for an uncoded error.
- A generator crash names the schema or operation it failed on, such as `While generating operation "listPets" (GET /pets)`, with a pointer to it.
- A JSON or YAML syntax error in `input` reports `KUBB_INVALID_DOCUMENT` with the file and the line and column.
- `plugins` entries are checked: a factory passed without calling it, a `null` entry, or a plugin listed twice reports `KUBB_INVALID_PLUGIN_OPTIONS`.
- `ctx.warn`, `ctx.error`, and `ctx.info` take an optional `{ code, help, location }`, and `ctx.error` keeps the code of a `Diagnostics.Error`.
- A failure in setup, such as an invalid plugin entry, now reaches the reporters as a failed run, so `--reporter json` still gets an entry. Errors outside a build go to stderr in `json` mode.
- A config that fails to load names its path, and a missing config lists where Kubb looked and suggests `kubb init`.
