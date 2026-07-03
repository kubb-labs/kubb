---
'@kubb/core': patch
'kubb': patch
---

Re-export `createKubb` from the `kubb` package so you can run a build programmatically without adding `@kubb/core` as a separate dependency.

`kubb` now re-exports `createKubb` (and the `BuildOutput`, `Config`, `CreateKubbOptions`, `Kubb`, and `UserConfig` types) from `@kubb/core`. It is the same function, so pass your `adapter`, `parsers`, and plugins as you would with `@kubb/core`. `@kubb/core` now also exports the `CreateKubbOptions` type.
