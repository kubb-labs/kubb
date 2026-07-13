---
'@kubb/core': patch
---

Stop `output.clean` from deleting the project root. When `output.path` resolved to the root directory or a parent of it (for example `path: '.'`), a build with `clean: true` wiped `kubb.config` and every source file. The build now throws before cleaning in that case, so clean only removes generated code.
