---
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
'@kubb/plugin-barrel': patch
'@kubb/ast': patch
---

Faster code generation with less allocation churn on large specs.

Profiling with [`@e18e/deopt`](https://github.com/e18e/deopt) and GC tracing turned up generation hot paths that kept falling off V8's fast path. The node factory now writes `kind` at a fixed offset so visitor and printer dispatch stays monomorphic, `transform` rebuilds an array only once a child actually changes, and `createFile` skips building the source text for files with no imports. A dictionary-mode `delete`, an iterator allocation, and a few `map().filter().join()` chains are gone too.

Output is unchanged. Local benchmarks run about 16 to 17% faster with fewer GC cycles.
