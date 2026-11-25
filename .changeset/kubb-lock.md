---
'@kubb/cli': minor
'@kubb/core': minor
---

Add `kubb.lock`, and make `kubb generate --check` compare against it.

`kubb generate` now writes `kubb.lock` to `root` when the config sets `output.format`, `output.lint`, or `output.postGenerate`. It records a hash of each generated file before and after those steps. Commit it with the generated files.

`--check` no longer generates into a temporary folder or runs the formatter and linter. It generates in memory and uses `kubb.lock` to recognize formatted output. This fixes `--check` exiting with 2 when an ignore rule skipped the temporary folder, such as `ignorePatterns` in `.oxlintrc.json`. `--dry-run` reads `kubb.lock` too, so it works on a fresh checkout.

`kubb.lock` replaces the output manifest in `node_modules/.cache/kubb`. `createOutputManifest` in `@kubb/core` now takes `{ storage, root }`.
