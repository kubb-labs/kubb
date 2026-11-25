---
'@kubb/cli': minor
'@kubb/core': minor
---

Add `kubb-lock.json`, and make `kubb generate --check` compare against it.

`kubb generate` now writes `kubb-lock.json` to `root`. For every generated file it records a hash of the code Kubb wrote and a hash of the file after `output.format`, `output.lint`, and `output.postGenerate`. Commit it with the generated files.

`--check` no longer generates into a temporary folder or runs the formatter and linter. It generates in memory and uses `kubb-lock.json` to recognize formatted output. This fixes `--check` exiting with 2 when an ignore rule skipped the temporary folder, such as `ignorePatterns` in `.oxlintrc.json`. `--dry-run` reads `kubb-lock.json` too, so it works on a fresh checkout.

`kubb generate` skips the build when the config, the spec, the installed package versions, and the generated files all match `kubb-lock.json`. Pass the new `--force` flag to generate, format, and lint anyway.

In `@kubb/core`, `Kubb.isUpToDate(config)` exposes the same check and `generate()` accepts `force`. The `Lockfile` class and its `createLockfile({ storage, root })` helper replace `createOutputManifest` and the `OutputManifest` type.
