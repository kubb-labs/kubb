---
"@kubb/core": patch
---

Support exports in injectFile type signature.

Extend `injectFile` to accept the same `FileNode` type as `createFile`, enabling plugins to use `createExport` and structured exports rather than raw string manipulation.

- Added `exports?: FileNode['exports']` to the `injectFile` parameter type
- Updated implementation to properly destructure and pass through the `exports` parameter
