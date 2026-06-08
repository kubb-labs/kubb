# 003, extract the shared plugin kit

## Context

Each plugin reimplements operation, parameter, import, and grouping logic, and the framework plugins react-query, vue-query, and swr duplicate TanStack wiring. TanStack Query keeps one framework-agnostic core with thin adapters. This slice consolidates the shared logic into one kit so the framework plugins become mappers over it.

## Goal (demonstrable outcome)

The react-query, vue-query, and swr plugins import their shared operation, parameter, query-key, and import logic from one kit, the duplicated helpers are deleted, and snapshots are unchanged.

## Prerequisites

Slice 002.

## Steps

1. Inventory the shared helpers across `internals/shared`, `internals/tanstack-query`, and `internals/utils`, and the three framework plugins. Record the non-test source lines per framework plugin as the starting point.
2. Resolve open question 2 and record it in `research.md`: publish as `@kubb/plugin-kit` if third-party authors should use it, or keep it in `internals/` with a documented surface.
3. Move the shared helpers into the kit, re-point the three plugins at it, and delete the duplicates.
4. Measure non-test source lines per framework plugin again, and record the drop.
5. Run the snapshots for the three plugins and the wider suite.

## Files touched

- `internals/plugin-kit` or `packages/plugin-kit` (created)
- the react-query, vue-query, and swr plugin sources (modified)
- the duplicated helpers (deleted)
- a changeset if the kit is published

## Verification

1. `pnpm --filter @kubb/plugin-react-query --filter @kubb/plugin-vue-query --filter @kubb/plugin-swr test` passes unchanged.
2. The line-count report shows the reduction per plugin.

## Done criteria

- [x] Shared operation and import logic lives in one place
- [x] The three framework plugins consume the kit and the duplicates are gone
- [x] Output is identical and the line-count drop is recorded

## Status

Shipped and validated locally (commit `932be77`, plugins #319). 71 react-query/vue-query/swr tests pass with no snapshot changes.

- The one piece of genuine duplication, the `getQueryOptionsParams` body copied across the three TanStack plugins, moved to `@internals/tanstack-query` as `buildQueryOptionsParams`. Each plugin's `getQueryOptionsParams` is now a one-line delegate, and vue-query keeps its `MaybeRefOrGetter` wrap.
- Open question 2 resolved: the kit stays in `internals/`, with no new published package, per the maintainer decision.
- The plugins were already factored. Their `utils.ts` are re-export barrels over `@internals/*`, and a cross-plugin scan found no other duplicated helpers, so the extraction is small by design rather than incomplete.
