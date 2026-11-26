---
'@kubb/cli': patch
'@kubb/core': patch
---

Improve the output of `kubb generate --check` and `--diff`.

- The summary counts the files that matched through `kubb-lock.json`, the way a package manager counts reused packages: `4 files checked · 3 from kubb-lock.json`. Dry runs show the count too. The JSON report has it as `filesFromLockfile`.
- `--diff` prints the diffs under a `Diff` heading, in color, without the `=====` separator.
- `--diff` on up-to-date output prints `No diff: the files on disk match the generated output.` Before, it printed no diff and no line about it.
- `--check` without `--diff` ends with `Run \`kubb generate --diff\` to see the changes.` when files are out of date.
- The missing-lockfile warning now says why a formatted file shows as out of date.
