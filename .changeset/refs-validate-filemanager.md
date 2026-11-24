---
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/mcp': patch
'@kubb/cli': patch
---

Fix `$ref` lookups, a cached spec, and how warnings and errors surface.

- `@kubb/adapter-oas`: A `$ref` with a malformed `%` escape, such as `#/components/schemas/100%`, or one that names an inherited property, such as `constructor`, now reports `KUBB_REF_NOT_FOUND`. Before, the first crashed the parse and the second resolved to a JavaScript function. `validate()` takes `fileRefs`, as `parse()` does. A cached parse also restores `adapter.document`, not only `adapter.sources`.
- `@kubb/core`: When one file fails to write, Kubb starts no further file. The shared-file mismatch warning is now `KUBB_SHARED_FILE_MISMATCH`, so it shows in `diagnostics` and `diagnostics.ignore` can hide it. When `output.format`, `output.lint`, or `output.postGenerate` is set but the storage is not named `fs`, Kubb warns with `KUBB_OUTPUT_PASSES_SKIPPED` instead of skipping them silently.
- `@kubb/mcp`: The `validate` tool lets a `$ref` read local files only inside the working directory, and fetch URLs only on public hosts.
- `@kubb/cli`: `kubb init` and `kubb studio` print the full diagnostic of a failure, including its fix, instead of the message alone.
