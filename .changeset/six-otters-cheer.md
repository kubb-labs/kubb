---
'@kubb/cli': patch
---

`kubb mcp` and `kubb validate` now load `@kubb/mcp` and `@kubb/adapter-oas` only when their
commands run. Every other command, including `kubb --help`, no longer touches either optional peer.
