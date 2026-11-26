---
'@kubb/cli': patch
'@kubb/core': patch
---

Restructure the end of every `kubb` run like `oxlint` and `pnpm`: the details first, then one verdict line, then `Finished in`.

- `kubb generate` ends with a verdict such as `✓ Generated 18 files · 54 unchanged (12 via kubb-lock.json)`, the kinds of change (`14 added · 3 modified · 1 deleted · +312 −47`), and `Finished in 466ms · ./src/gen · 4 plugins`. The `Plugins`, `Issues`, `Output`, and `File changes` rows are gone.
- `--check` lists each out-of-date file once. With `--diff`, the file's hunks follow its row, without the `=====`, `---`, and `+++` lines. The verdict reads `✗ 3 files out of date · 70 up to date (68 via kubb-lock.json)`, then one line on what to run next.
- A missing `kubb-lock.json`, or `--no-lockfile`, prints its warning before the verdict and says why formatted files show as out of date.
- Files that match through `kubb-lock.json` are counted, like the "reused" count of a package manager. The JSON report has the count as `filesFromLockfile` and the lockfile state as `check.lockfile`.
- A run the lockfile skips prints `kubb-lock.json is up to date, generation is skipped`.
- `kubb validate`, `add`, `remove`, and `update` print their details first and end with the verdict and `Finished in`.
- A missing or unknown argument prints the error and a hint to run `--help`, without a stack trace.
