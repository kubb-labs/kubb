---
"@kubb/adapter-oas": minor
"@kubb/cli": patch
---

Remove the standalone `@kubb/oas` package from the monorepo.

Use `@kubb/adapter-oas` for OpenAPI parsing, validation, and shared OAS helper types instead. The `kubb validate` command now uses `@kubb/adapter-oas` directly, so it no longer requires `@kubb/oas` to be installed separately.
