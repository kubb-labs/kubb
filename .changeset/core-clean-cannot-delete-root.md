---
'@kubb/core': patch
---

Stop `output.clean` from deleting the project root. When `output.path` resolved to the root directory or a parent of it (for example `path: '.'`), a build with `clean: true` wiped `kubb.config` and every source file. The build now fails with a `KUBB_CLEAN_ROOT` diagnostic before cleaning, so clean only removes generated code.
