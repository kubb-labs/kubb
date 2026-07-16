---
'@kubb/core': patch
---

Plugin generators now run straight from the generate loop instead of riding the `Hookable` bus as name-guarded listeners, so dispatch no longer fans out across every plugin on every node. Each operation is resolved once rather than twice. The `kubb:generate:*` hooks still fire for external listeners and the generated output is identical.
