---
'@kubb/cli': patch
---

`kubb mcp` and `kubb validate` now load `@kubb/mcp` and `@kubb/adapter-oas` only when that
command runs, the same as `kubb studio` already did for `@kubb/studio`. Every other command,
including `kubb --help`, no longer touches either optional peer.

Also documents `KUBB_HOME`, the env var `kubb studio` already read to relocate its stored
credential, machine secret, and session cache away from `~/.kubb`.
