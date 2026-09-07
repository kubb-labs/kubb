---
'@kubb/core': patch
'@kubb/cli': patch
'@kubb/kit': patch
---

Moved shared-utility logic used by only one package out of `@internals/utils` and into that
package (`@kubb/core`, `@kubb/cli`, `@kubb/kit`). No public API or behavior changed.
