---
'@kubb/parser-ts': patch
'@kubb/adapter-oas': patch
'@kubb/plugin-barrel': patch
'@kubb/ast': patch
---

Faster code generation with less allocation churn on large specs.

Profiling with [`@e18e/deopt`](https://github.com/e18e/deopt) and Node's GC tracing showed the node
factory, the `transform`/`collect` visitors, and the TypeScript printer falling off V8's fast path
and allocating more than they needed to. The fixes are behavior-preserving and produce identical
output.

`defineNode` writes the `kind` discriminant at a fixed object offset, so the `node.kind` reads that
drive every visitor and printer dispatch stay monomorphic. `transform` and `collect` thread the
visitor through the recursion instead of rebuilding an options object per node, and `transform`
rebuilds an array child only once a descendant actually changes, so unchanged subtrees keep their
original arrays and allocate nothing. `walk` collects child promises in a single array rather than
two. `extractStringsFromNodes` and `printSource` run as flat loops instead of `map().filter().join()`
chains.

`createFile` no longer builds the source string or the local-name set for files that declare no
imports, since import resolution is their only consumer, and it extracts the source in one pass
instead of wrapping each code node in a throwaway array. The OpenAPI adapter drops a `delete` that
forced dictionary mode in `flattenSchema`, and the barrel plugin loops over its prefix set directly
instead of allocating an iterator through `.values().some()`.

In local benchmarks this runs about 16 to 17% faster on both the transform-and-print path and the
file-build path, with fewer garbage-collection cycles and the same retained memory.
