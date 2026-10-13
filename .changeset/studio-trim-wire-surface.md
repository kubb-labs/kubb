---
'@kubb/studio': minor
---

Drop the unused `importName` field of the `add-plugin` config edit, the `file` field of `SaveResult`, the `InstalledExtensions` export of the package root (now in `@kubb/studio/protocol`), and the `@kubb/core` type re-exports from `@kubb/studio/protocol`; import those types from `@kubb/core`.
