---
"@kubb/core": patch
"@kubb/agent": patch
---

Remove dependency on `@kubb/oas` from `@kubb/core`. `HttpMethod` is now imported from `@kubb/ast`.

Plugins have been moved to their own repository. `@kubb/agent` no longer bundles individual plugin packages as direct dependencies.
