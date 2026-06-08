# 001, enforce core and plugin boundaries

## Context

The clean layering, where ast sits under renderer under core under the adapters, parsers, and plugins, is only a convention today. Both `oxlint.config.ts` files carry no import restrictions, and there is no dependency-graph check, so one import can couple a plugin to adapter internals or make ast reach back into core. This slice pins the current graph before any refactor moves code, so later slices cannot regress it.

## Goal (demonstrable outcome)

`pnpm boundaries` passes on the current tree and fails with a named rule when a plugin imports `@kubb/adapter-oas`.

## Prerequisites

None.

## Steps

1. Add `dependency-cruiser` as a dev dependency at the root of both repos.
2. Author `.dependency-cruiser.cjs` in each repo encoding the allowed directions from `plan.md`. Forbid ast depending on any `@kubb/*`, forbid `plugin-*` depending on `@kubb/adapter-*`, and forbid reaching into another package's `src` across a package boundary.
3. Add a `"boundaries"` script that runs `depcruise` over `packages` and `internals`, and call it from CI in both repos.
4. Add a small number of oxlint `no-restricted-imports` entries for single-file rules where dependency-cruiser granularity is awkward.
5. Record baseline metrics into `baseline.md`: the output of `pnpm why react-reconciler`, the current `@kubb/renderer-jsx` size budget, and an inventory of the symbols plugins import from core, ast, and renderer-jsx.

## Files touched

- `.dependency-cruiser.cjs` (created, kubb and plugins repos)
- `package.json` (modified, both repos: dev dependency and script)
- `.github/workflows/*` (modified, both repos: boundary step)
- `oxlint.config.ts` (modified, both repos: targeted restrictions)
- `plans/core-plugin-simplification/baseline.md` (created)

## Verification

1. `pnpm boundaries` exits 0 on a clean tree.
2. Add `import { adapterOas } from '@kubb/adapter-oas'` to a plugin source, run `pnpm boundaries`, see it fail and name the rule, then revert.
3. `pnpm lint` and `pnpm typecheck` stay green.

## Done criteria

- [ ] The boundary check runs in CI for both repos
- [ ] A planted cross-layer import fails the check with a clear rule name
- [ ] `baseline.md` is committed with the dependency, size, and imported-symbol numbers
