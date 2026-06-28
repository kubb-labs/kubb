---
'@kubb/parser-ts': patch
'@kubb/ast': patch
---

Keep the AST and printer hot paths on V8's optimized tier for large specs.

Profiling code generation with [`@e18e/deopt`](https://github.com/e18e/deopt) showed the node
factory, the `transform`/`collect` visitors, and the TypeScript printer falling off V8's fast path
on big specs. `defineNode` now writes the `kind` discriminant at a fixed object offset, so the
`node.kind` reads that drive every visitor and printer dispatch stay monomorphic instead of going
megamorphic. `transform` and `collect` thread the visitor through the recursion rather than
rebuilding an options object per node, and `extractStringsFromNodes` and `printSource` run as flat
loops instead of `map().filter().join()` chains. Same output, fewer reoptimizations — about 20%
faster on the transform-and-print path in local benchmarks, with the build pipeline unchanged.
