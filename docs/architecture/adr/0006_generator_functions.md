# ADR-0006: Generator functions for lazy AST traversal

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle |       | 2026-05-16    |

## Context

Kubb processes large OpenAPI specifications. Stripe's public API, for example, declares over 1,400 component schemas and nearly 300 operations. During code generation, two phases dominate peak memory usage.

The first is schema sorting. `sortSchemas()` in `packages/adapter-oas/src/resolvers.ts` calls `collectRefs()` once per schema to build a dependency graph. `collectRefs()` is a recursive object walk that accumulates a `Set<string>` of referenced schema names, and the caller immediately converts it to an array with `Array.from()`. On a 1,400-schema spec this creates 1,400 intermediate `Set` and `Array` objects before topological sorting begins.

The second is AST traversal. `collect()` in `packages/ast/src/visitor.ts` extracts typed values from an AST subtree. It is recursive: each call allocates a fresh `Array<T>`, pushes items from the current node and every child, and returns the full array. For a 1,400-schema AST with 5-10 levels of property nesting the call tree can create tens of thousands of short-lived arrays that all remain live during traversal, then become garbage at once, spiking GC pause times.

`getChildren()`, the private function that produces a node's traversable children, makes this worse. For every `Input` node it returns `[...node.schemas, ...node.operations]`, and for every `Operation` node it spreads parameters, request body schemas, and responses into a new array. These allocations are discarded immediately after the `for...of` loop iterates them.

The problems stack: `collect()` calls `getChildren()` at every recursion level, so a single top-level `collect()` call on a large spec produces O(nodes) `getChildren` arrays and O(nodes) per-level `collect` result arrays.

## Decision

`collect()` is refactored into two functions: `collectLazy()`, the exported generator that traverses the AST node by node, and `collect()`, the wrapper that materializes results with `Array.from(collectLazy(node, options))`. `getChildren()` is converted to a generator that `yield*`s children directly. `collectRefs()` is converted to a generator that `yield*`s `$ref` names as it walks the raw JSON object tree.

The public `collect()` signature stays identical: it still returns `Array<T>`. `collectLazy()` is exported alongside it for callers that can consume the traversal lazily without materializing a full array.

`containsCircularRef()` is rewritten to use `collectLazy()` with an early-exit loop. It previously called `collect()` and checked `.length > 0`, which traversed the entire subtree even after finding the first match. With a generator it stops at the first yielded value.

## Rationale

Generators are pull-based: the caller drives iteration step by step, and nothing is produced until requested. That makes them a good match for recursive tree traversal, particularly when the caller wants to stop early.

The two alternatives considered were stack-based iterative traversal and object pooling. Stack-based iteration eliminates recursion depth but requires maintaining a manual stack object, which is more code without better composability. Object pooling reduces allocations but requires careful ownership tracking, which is error-prone in a recursive setting where callers may hold references across calls. Generators get to near-zero allocations with code that reads almost identically to the original: `yield v` and `yield* collectLazy(child, opts)` replace `results.push(v)` and the inner `for...of` merge loop.

`collect()` stays backward compatible because it still returns `Array<T>`. `collectLazy()` is an additive export; no existing call site needs to change.

## Consequences

### Positive

- Peak heap during a full `collect()` traversal drops from O(nodes) intermediate arrays to one final `Array.from()` allocation at the top level.
- `getChildren()` no longer allocates a temporary array per visited node; children stream directly into the `for...of` body.
- `containsCircularRef()` short-circuits on the first match, reducing traversal from O(subtree size) to O(depth-to-first-match) on average.
- `collectRefs()` eliminates the `Array.from(Set)` call in `sortSchemas()` that previously ran once per schema.
- Plugin authors who import `collectLazy()` from `@kubb/ast` can write their own lazy schema visitors without materializing intermediate arrays.

### Negative

- Generator functions introduce a new mental model. Developers unfamiliar with `function*`, `yield`, and `yield*` may find the traversal code harder to follow initially.
- `collect` stays synchronous while `walk()` remains async. This preserves the existing boundary but means the two traversal APIs diverge in style.
- Whether the allocation reduction translates to measurable wall-clock improvement is unconfirmed. Modern V8 handles short-lived array allocations well, so profiling is needed before claiming a win.

## Considered options

### Option A: Private generator + public wrapper (chosen)

`collectLazy()` is the exported generator. `collect()` wraps it with `Array.from()`. No existing call site changes. The early-exit optimization in `containsCircularRef()` is the immediate behavioral win.

### Option B: Stack-based iterative traversal

Replace recursion with an explicit `while (stack.length)` loop that pushes child nodes. This eliminates recursion stack depth and avoids generator frame overhead, but requires maintaining a manual stack object and increases code complexity without offering better composability than generators. Not chosen.

### Option C: Object pooling

Reuse `Array` instances across `collect()` calls by resetting and returning them to a pool after use. This reduces GC pressure without changing the algorithm, but requires careful ownership tracking: callers cannot hold references to returned arrays across calls, which is error-prone in a recursive setting. Not chosen.

### Option D: Do nothing

Acceptable for small specs. For enterprise-scale specs like Stripe, Kubernetes, and GitHub the allocation pressure is measurable. Not chosen.

## Related ADRs

- [ADR-0001: Include filter schema scoping](./0001_include_filter.md) — `collectUsedSchemaNames()` is the main consumer of `collect()` in the include-filter path and benefits directly from the generator optimization.
