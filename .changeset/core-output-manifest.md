---
'@kubb/core': patch
---

Stop rewriting generated files that the formatter reflows.

Comparing the trimmed text covers a formatter that only adds a trailing newline. One configured in a style Kubb does not emit rewrites the code itself, so the text never matches and every file is rewritten on every build.

Kubb now remembers what each source became after the formatter, linter, and `postGenerate` ran, and checks that before writing. It compares both the source and the file on disk, so a changed source or a hand-edited file is still rewritten, and a missing or outdated record costs one extra write pass.

A new `cacheStorage` keeps that record in `node_modules/.cache/kubb`, or in the OS temp directory when the project has no `node_modules`.
