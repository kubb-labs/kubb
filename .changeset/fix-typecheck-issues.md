---
'@kubb/core': patch
'@kubb/cli': patch
---

Fix typecheck issues.

- Remove unused `FileNode` and `Plugin` imports from `Kubb.ts`
- Fix `context.emit('kubb:info', text)` to pass the correct `KubbInfoContext` shape (`{ message: text }`)
- Remove unused `config` destructure in `plainLogger.ts` generation start handler
