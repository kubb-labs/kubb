---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/adapter-oas': patch
'@kubb/mcp': patch
'@kubb/studio': patch
'unplugin-kubb': patch
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
- Kubb, its CLI, Studio, and the bundler plugin now throw every error as a `Diagnostics.Error` with a code, so each one can be shown with its fix or read by a tool. A new `KUBB_INTERNAL_ERROR` code marks a bug in Kubb itself. When a cause chain holds several coded errors, the innermost one wins. A `*_FAILED` code an extension throws itself now also gets its `report:` link.
- The CLI renders diagnostics for its reader. In a terminal, problems are grouped by plugin with the code on the right, a `fix` row, and a `Learn more` link, and the run closes on `✖ Failed  1 error · 1 warning  in plugin-ts`. For an AI agent, CI, or a pipe, each problem is plain labeled rows (`at:`, `why:`, `fix:`, `caused by:`, `stack:` for a crash, `docs:`, `report:`), and the run ends on one line such as `Kubb failed: 1 error (plugin-ts). Exit code 1.` The MCP tools use the same agent output. `Diagnostics.format` takes `{ audience, verbose, width }`.
- `--reporter json` no longer prints the CLI header line to stdout.
