---
'@kubb/adapter-oas': patch
'@kubb/core': patch
'@kubb/ast': patch
---

Remove internal dead code flagged by knip in production mode. No public API changes. Every removed symbol was unexported (not part of any package's `exports`) and unused across the workspace and the plugins repo.

- `@kubb/adapter-oas`: drop the orphaned `applyDiscriminatorInheritance` and `getMediaType` helpers (the streaming path already uses `buildDiscriminatorChildMap`/`patchDiscriminatorNode` directly).
- `@kubb/core`: drop the unused `decodeAst` devtools helper.
- `@kubb/ast`: drop the unused `buildRefMap`, `resolveRef`, `refMapToObject` helpers and the unused node guards (`isPropertyNode`, `isParameterNode`, `isResponseNode`, `isFunctionParameterNode`, `isParameterGroupNode`, `isFunctionParametersNode`). The public `RefMap` type and `extractRefName` are kept.
