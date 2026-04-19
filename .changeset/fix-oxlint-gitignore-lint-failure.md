---
"@kubb/cli": patch
"@internals/utils": patch
---

Fix oxlint failing on gitignored output directories.

When `output.lint` is set to `'auto'` or `'oxlint'`, oxlint respects `.gitignore` during directory traversal and skips any files matched by it — causing "No files found to lint" for generated output directories that are gitignored. The CLI now collects files explicitly via Node's `readdirSync` and passes them as individual path arguments to oxlint, bypassing gitignore-based filtering entirely.

Also fixes a misleading `"Oxlint not found"` error message that was always shown on any linting failure, even when oxlint was found and simply exited with a non-zero code. The actual failure reason (e.g. `"Hook execute failed: oxlint --fix …"`) is now surfaced correctly.
