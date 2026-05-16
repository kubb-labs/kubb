# ADR-0006: Generator functions for lazy AST traversal

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Proposed | @stijnvanhulle | @stijnvanhulle |       | 2026-05-16    |

## Context

Kubb processes large OpenAPI specifications — Stripe's public API, for example, declares over 1,400 component schemas and nearly 300 operations. During code generation, two phases dominate peak memory usage.

The first is schema sorting. `sortSchemas()` in `packages/adapter-oas/src/resolvers.ts` calls `collectRefs()` once per schema to build a dependency graph. `collectRefs()` is a recursive object walk; for each schema it accumulates a `Set<string>` of referenced schema names and the caller immediately converts it to an array with `Array.from()`. On a 1,400-schema spec this creates 1,400 intermediate `Set` and `Array` objects simultaneously before topological sorting begins.

The second is AST traversal. `collect()` in `packages/ast/src/visitor.ts` is the primary tool for extracting typed values from an AST subtree. It is recursive: each call allocates a fresh `Array<T>`, pushes items from the current node and every child, and returns the full array to the caller, which then merges it into its own array. For a 1,400-schema AST with 5–10 levels of property nesting the call tree can create tens of thousands of short-lived arrays that all remain live during the traversal and then become garbage simultaneously, spiking GC pause times.

`getChildren()`, the private function that produces a node's traversable children, compounds the problem. For every `Input` node it returns `[...node.schemas, ...node.operations]`, and for every `Operation` node it spreads parameters, request body schemas, and responses into a new array. These allocations are discarded immediately after the `for...of` loop iterates them.

The problems compound one another: `collect()` calls `getChildren()` at every recursion level, so a single top-level `collect()` call on a large spec produces O(nodes) `getChildren` arrays and O(nodes) per-level `collect` result arrays.

## Decision

`collect()` is split into a private generator `_collectGen()` and a public wrapper that materializes the generator into an array only at the top level. `getChildren()` is converted to a generator that `yield*`s children directly. `collectRefs()` is converted to a generator that `yield*`s `$ref` names as it walks the raw JSON object tree.

The public `collect()` signature stays identical — it still returns `Array<T>`. A new `collectGen()` function is exported alongside it for callers that can consume the traversal lazily without materializing a full array.

`containsCircularRef()` is rewritten to use `collectGen()` with an early-exit loop. It currently calls `collect()` and checks `.length > 0`, which traverses the entire subtree even after finding the first match. With a generator it stops at the first yielded value.

## Rationale

Generator functions in JavaScript are pull-based: a caller drives the generator step by step, and no value is produced until it is requested. This makes them the natural fit for recursive tree traversal where the caller only needs to process items one at a time — or stop early.

The alternative approaches considered were object pooling (reusing arrays instead of allocating new ones) and explicit stack-based iteration (replacing recursion with a `while` loop and a manual stack). Object pooling requires a reset protocol and makes the code harder to follow; stack-based iteration unrolls the recursion but still requires a data structure proportional to tree depth. Generators achieve zero-allocation recursion with syntax that reads almost identically to the original recursive code — `yield v` and `yield* recursiveCall(child)` replace `results.push(v)` and the inner `for...of` merge loop.

Backward compatibility is preserved because `collect()` continues to return `Array<T>`. The generator is purely an implementation detail until callers opt in by calling `collectGen()` instead.

## Consequences

### Positive

- Peak heap during a full `collect()` traversal drops from O(nodes) intermediate arrays to one final `Array.from()` allocation at the top level.
- `getChildren()` no longer allocates a temporary array per visited node; children stream directly into the `for...of` body.
- `containsCircularRef()` short-circuits on the first match, reducing traversal from O(subtree size) to O(depth-to-first-match) on average.
- `collectRefs()` eliminates the `Array.from(Set)` call in `sortSchemas()` that previously ran once per schema.
- Plugin authors who import `collectGen()` from `@kubb/ast` can write their own lazy schema visitors without materializing intermediate arrays.

### Negative

- Generator functions introduce a new mental model to the codebase. Developers unfamiliar with the generator protocol (`function*`, `yield`, `yield*`) may find the traversal code harder to read initially.
- Async generators (`async function*`) are not used here; the `walk()` function remains async and concurrent. Keeping `collect` sync and `walk` async preserves the existing boundary but means the two traversal APIs diverge in style.
- Profiling would be needed to confirm that the allocation reduction translates to measurable wall-clock improvement in practice, since modern V8 is well-optimized for short-lived array allocations.

## Considered options

**Option A: Private generator + public wrapper (chosen)**

`_collectGen()` is the recursive generator. `collect()` wraps it with `Array.from()`. `collectGen()` is exported as a new, additive API. No existing call site changes. The early-exit optimization in `containsCircularRef()` is the immediate behavioral win.

**Option B: Stack-based iterative traversal**

Replace recursion with an explicit `while (stack.length)` loop that pushes child nodes. Eliminates recursion stack depth and avoids generator frame overhead. However, this requires maintaining a manual stack object and increases code complexity without offering better composability than generators. Not chosen.

**Option C: Object pooling**

Reuse `Array` instances across `collect()` calls by resetting and returning them to a pool after use. Reduces GC pressure without changing the algorithm. However, it requires careful ownership tracking — callers cannot hold references to returned arrays across calls — which is error-prone in a recursive setting. Not chosen.

**Option D: Do nothing**

Acceptable for small specs. For enterprise-scale specs (Stripe, Kubernetes, GitHub) the allocation pressure is measurable. Not chosen.

## Related ADRs

- [ADR-0001: Include filter schema scoping](./0001_include_filter.md) — `collectUsedSchemaNames()` is the main consumer of `collect()` in the include-filter path and benefits directly from the generator optimization.
