---
'@kubb/core': patch
---

Stop rewriting generated files whose formatter reflows them.

Comparing the trimmed text already covers a formatter that only adds a trailing newline. A formatter configured in a style Kubb does not emit rewrites the code itself, so the text never matches and every file is rewritten on every build.

Kubb now records what each source turned into once the formatter, linter, and `postGenerate` were done with it, and consults that before writing. A file the formatter already produced from this exact source is left alone. Both the source and what is on disk are checked, so a changed source or a hand-edited file is still rewritten, and a missing, unreadable, or outdated record just means one extra write pass.

The record is held by a new `cacheStorage`, which keeps build state in `node_modules/.cache/kubb`, falling back to a per-root directory in the OS temp directory when there is no `node_modules`. It sits alongside `fsStorage` and `memoryStorage`, and is deliberately separate from the configured output storage so local build state never follows generated code into an in-memory store or a bucket.
