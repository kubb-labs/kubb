---
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
'@kubb/plugin-barrel': patch
'@kubb/ast': patch
---

Keep the code-generation hot paths on V8's optimized tier for large specs.

Profiling code generation with [`@e18e/deopt`](https://github.com/e18e/deopt) showed the node
factory, the `transform`/`collect` visitors, and the TypeScript printer falling off V8's fast path
on big specs. `defineNode` now writes the `kind` discriminant at a fixed object offset, so the
`node.kind` reads that drive every visitor and printer dispatch stay monomorphic instead of going
megamorphic. `transform` and `collect` thread the visitor through the recursion rather than
rebuilding an options object per node, and `extractStringsFromNodes` and `printSource` run as flat
loops instead of `map().filter().join()` chains.

The OpenAPI adapter and barrel plugin pick up two smaller fixes from the same profiling pass.
`flattenSchema` destructures `allOf` out instead of `delete`-ing it, which kept the merged schema in
V8's fast property mode, and the barrel plugin's excluded-path check loops over the prefix set
directly instead of allocating an iterator through `.values().some()`.

Same output and behavior throughout. About 20% faster on the transform-and-print path in local
benchmarks, with the build pipeline unchanged.
