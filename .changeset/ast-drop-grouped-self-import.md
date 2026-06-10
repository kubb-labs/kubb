---
'@kubb/ast': patch
---

Drop self-imports of locally-defined symbols in consolidated output (`mode: 'group'`/`mode: 'file'`).

A grouped file that defines a type (e.g. `Pet`) no longer also imports that same type. In group mode the import for a referenced schema resolves to the per-schema path while the file lives at the group path, so the existing path-based filter could not match. `createFile` now also drops any import whose binding is defined locally by one of the file's own sources. The local definition stays in place.
