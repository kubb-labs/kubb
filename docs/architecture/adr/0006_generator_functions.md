# ADR-0006: Generator functions for lazy AST traversal

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle |       | 2026-05-16    |

## Context

Every value created in JavaScript lives on the heap. Arrays, sets, and objects are allocated there and held live until the garbage collector decides they are no longer reachable. V8 uses a generational GC: short-lived objects accumulate in the young generation (nursery). When too many objects are alive at once, the nursery overflows and a minor GC pause runs to recover memory. If objects survive long enough, they are promoted to the old generation, where reclaiming them requires a full major GC, a much more expensive operation.

In Kubb, the `collect()` function in `packages/ast/src/visitor.ts` and the `collectRefs()` function in `packages/adapter-oas/src/resolvers.ts` both perform recursive tree walks that accumulate results into arrays. On a large OpenAPI spec (Stripe declares over 1,400 component schemas), this means:

- `collect()` allocates a fresh `Array<T>` at every recursion level. For a 1,400-schema AST with 5-10 levels of nesting, a single top-level call creates tens of thousands of intermediate arrays. All of them are live simultaneously during traversal because each frame waits for its children to finish before merging results. Once the call returns, the entire set becomes garbage at once, causing a spike in GC work.
- `getChildren()` makes this worse. It previously returned a new spread array for every visited node, allocations discarded immediately after one loop iteration.
- `collectRefs()` runs once per schema inside `sortSchemas()`. Each call builds a `Set<string>` and then converts it to an array with `Array.from()`, creating 1,400 intermediate set-plus-array pairs before topological sorting begins.

The core issue is that recursive functions accumulate results by keeping every partial result alive on the call stack until the recursion unwinds. With `yield`, a generator suspends at each value and resumes only when the caller asks for the next one. The generator's local state is stored as a small heap object, but intermediate result arrays are never needed: items flow out one at a time.

## Decision

`collectLazy()` is introduced as an exported `function*` that traverses the AST depth-first and `yield`s values one at a time. `collect()` becomes a thin wrapper: `Array.from(collectLazy(node, options))`. The array is built exactly once, at the call site that needs it.

`getChildren()` is converted to a `function*` that `yield*`s children directly into the caller's loop. No intermediate array is created per node.

`collectRefs()` is converted to a `function*` that `yield*`s `$ref` names as it walks the raw JSON object tree. `sortSchemas()` iterates it directly with `for...of`, eliminating the per-schema `Set` and `Array.from()` call.

`containsCircularRef()` uses `collectLazy()` with an early-exit `for...of` loop that `break`s on the first match. The previous implementation called `collect()` and checked `.length > 0`, traversing the full subtree even when the answer was found at the first node.

The public `collect()` signature is unchanged. `collectLazy()` is an additive export for callers that want to consume traversal lazily.

## Rationale

Generators eliminate the core problem without changing the algorithm. `yield v` replaces `results.push(v)` and `yield* collectLazy(child, opts)` replaces the merge loop. The code reads almost identically to the original.

Stack-based iteration (an explicit `while (stack.length)` loop) also avoids simultaneous live allocations, but requires maintaining a manual stack object and makes the traversal logic harder to follow. Generators preserve the natural recursive structure while solving the same heap problem.

Object pooling (reusing array instances across calls) reduces GC pressure without changing the algorithm, but requires callers to never hold references to returned arrays across calls. That constraint is impossible to enforce in a recursive setting and makes the API unsafe.

## Consequences

### Positive

- Peak heap during `collect()` traversal drops from O(nodes) simultaneous live arrays to one `Array.from()` allocation at the top.
- `getChildren()` no longer allocates a temporary array per node; children flow directly into the `for...of` body.
- `collectRefs()` removes the per-schema `Set` and `Array.from()` pair inside `sortSchemas()`.
- `containsCircularRef()` stops at the first match instead of walking the full subtree.
- `collectLazy()` is available as a public export for plugin authors who want lazy traversal without materializing a full array.

### Negative

- `function*`, `yield`, and `yield*` are a new mental model for contributors who have not worked with generators before.
- Whether the allocation reduction produces measurable wall-clock improvement depends on the GC behavior of the host V8 version and spec size. Profiling is needed to confirm a real-world win.

## Considered options

### Option A: Generator with public lazy export (chosen)

`collectLazy()` is the exported `function*`. `collect()` wraps it with `Array.from()`. No existing call site changes. The early-exit in `containsCircularRef()` is the immediate behavioral win.

### Option B: Stack-based iterative traversal

Replace recursion with an explicit `while (stack.length)` loop. This also avoids simultaneous live allocations and removes recursion depth from the call stack. It does not, however, compose as cleanly: `yield*` delegation is not available, so merging results from children requires manual bookkeeping. Not chosen.

## Related ADRs

- [ADR-0001: Include filter schema scoping](./0001_include_filter.md): `collectUsedSchemaNames()` is the main consumer of `collect()` in the include-filter path and benefits directly from the generator optimization.
