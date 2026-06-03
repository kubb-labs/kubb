---
'@kubb/cli': patch
---

Fix `lint: 'auto'` (and `lint: 'oxlint'`) failing with "No files found to lint" when the generated output directory is gitignored.

The oxlint hook passed the output directory with `--no-ignore`, but oxlint's `--no-ignore` only disables `.eslintignore`, not `.gitignore`. Generated output dirs are usually gitignored, so oxlint walked the directory, skipped every file, and exited non-zero. The hook now also passes `--no-error-on-unmatched-pattern`, so a fully gitignored output dir is skipped instead of failing the run.
