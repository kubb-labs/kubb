---
'@kubb/cli': minor
'@kubb/core': minor
---

Add `kubb.lock`, and make `kubb generate --check` compare against it.

`kubb generate` now writes `kubb.lock` to `root`. For every generated file it records a hash of the code Kubb wrote and a hash of the file after `output.format`, `output.lint`, and `output.postGenerate`. Commit it with the generated files.

`--check` no longer generates into a temporary folder or runs the formatter and linter. It generates in memory and uses `kubb.lock` to recognize formatted output. This fixes `--check` exiting with 2 when an ignore rule skipped the temporary folder, such as `ignorePatterns` in `.oxlintrc.json`. `--dry-run` reads `kubb.lock` too, so it works on a fresh checkout.

`kubb.lock` replaces the output manifest in `node_modules/.cache/kubb`. `createOutputManifest` in `@kubb/core` now takes `{ storage, root }`.
