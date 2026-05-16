# ADR-0006: Generator functions for lazy AST traversal

| Status   | Authors        | Reviewers      | Issue | Decision date |
| -------- | -------------- | -------------- | ----- | ------------- |
| Accepted | @stijnvanhulle | @stijnvanhulle |       | 2026-05-16    |

## Context

Recursive tree walks in `collect()` and `collectRefs()` allocate a new array at every call frame. On a large spec (Stripe has 1,400+ schemas) all intermediate arrays are live on the heap simultaneously until the recursion unwinds, then become garbage at once and spike the V8 GC. `getChildren()` added more pressure by spreading children into a throwaway array on every node visit.

## Decision

`collect()` is split into `collectLazy()` (exported `function*` that `yield`s values one at a time) and `collect()` (thin wrapper using `Array.from()`). `getChildren()` and `collectRefs()` are also converted to generators with `yield*`. `containsCircularRef()` uses `collectLazy()` with an early-exit loop, stopping at the first match instead of traversing the full subtree.

The public `collect()` signature is unchanged.

## Rationale

`yield` suspends the generator frame after each value; no intermediate arrays accumulate on the heap. The algorithm stays recursive and the code is nearly identical to the original. Stack-based iteration would eliminate the same allocations but requires manual bookkeeping and loses composability via `yield*`.

## Consequences

### Positive

- Peak heap during traversal drops from O(nodes) live arrays to one `Array.from()` at the top.
- `getChildren()` no longer allocates a temporary array per node.
- `collectRefs()` removes the per-schema `Set` and `Array.from()` inside `sortSchemas()`.
- `containsCircularRef()` stops at the first match.

### Negative

- `function*`, `yield`, and `yield*` are unfamiliar to contributors who have not used generators before.

## Related ADRs

- [ADR-0001: Include filter schema scoping](./0001_include_filter.md): `collectUsedSchemaNames()` benefits directly from the generator optimization.
