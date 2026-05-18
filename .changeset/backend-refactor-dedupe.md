---
"@kubb/core": patch
"@kubb/ast": patch
"@kubb/cli": patch
"@kubb/parser-ts": patch
---

Internal cleanup: dedupe backend code and drop unused exports across `@kubb/parser-ts`, `@kubb/core`, `@kubb/ast`, `@kubb/cli`, and `@internals/utils`. Rename `QUITE_FLAGS` → `QUIET_FLAGS` in CLI.
