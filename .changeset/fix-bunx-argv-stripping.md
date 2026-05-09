---
'@internals/utils': patch
---

Fix `bunx kubb` (and other non-Node runtimes) incorrectly using the runtime executable path as the OpenAPI input.

The CLI argument parser only stripped the leading `[executable, script]` entries from `process.argv` when `argv[0]` contained the string `'node'`. When running via `bunx`, `deno`, `tsx`, or any other runtime, `argv[0]` was something like `/usr/local/bin/bun` — which was never stripped, so it ended up as `positionals[0]` and was passed to Redocly as the OpenAPI spec path, producing a `YamlParseError: null byte is not allowed in input`.

The check is now runtime-agnostic: argv stripping happens whenever `argv[0]` contains a path separator (`/` or `\`), which is true for every absolute executable path and false for bare command names.
