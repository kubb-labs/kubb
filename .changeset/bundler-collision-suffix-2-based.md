---
'@kubb/adapter-oas': patch
---

Shift bundler-created collision suffixes from 1-based to 2-based.

`api-ref-bundler` resolves schema name conflicts by appending a counter starting at `1` (e.g. a second `Category` becomes `Category1`). Kubb's same-source collision naming in `getSchemas` starts at `2` (`Category`, `Category2`, …). `bundleDocument` now post-processes the bundled document to align the bundler's naming with that convention, renaming `Category1` to `Category2`, `Category2` to `Category3`, and so on. `$ref` strings throughout the document are updated to match.
