# Research, core and plugin complexity reduction

## Open questions

1. Do any official plugins or examples rely on the async fiber `Runtime` (React hooks or suspense in a component) rather than `jsxRendererSync`? The removal in slice 003 depends on the answer, so slice 003 starts with an audit.
2. Which home for the shared plugin kit: a published `@kubb/plugin-kit` that third-party authors can use, or the existing unpublished `internals/*`? Resolved inside slice 004 and recorded here.
3. Does the builder API cover everything the JSX components express today, including conditional sources and fragments? Confirmed in slice 002 before any runtime is removed.

## Decisions

| Question | Decision | Why |
| -------- | -------- | --- |
| How to enforce layer boundaries | dependency-cruiser in CI per repo, plus a few oxlint `no-restricted-imports` for the hardest single rules | Keeps the current oxlint, oxfmt, tsdown, Turborepo toolchain and its speed. The nx boundary rule is eslint-only and would mean re-adding eslint. dependency-cruiser reads the workspace graph and expresses nx-style dependency constraints without adopting a runtime framework. |
| Primary emit path | Make the structured `create*` builders the primary path and keep JSX as opt-in sugar that lowers to the same nodes | The code nodes already exist (`ConstNode`, `TypeNode`, `FunctionNode`), the sync renderer already lowers JSX to them, and hey-api shows React is not required to render. Fewer representation conversions and fewer dependencies. |
| react-reconciler | Remove the async fiber runtime once the audit confirms the sync path covers the official plugins | The official plugins already default to `jsxRendererSync`. The fiber runtime, react-reconciler, and scheduler are weight on a path nothing uses by default. |
| Home for shared logic | Promote the shared operation, parameter, import, and group helpers into one kit consumed by every plugin | TanStack Query keeps one framework-agnostic core with thin adapters. The same shape makes the framework plugins mapping-only and gives third-party authors the same helpers. |
| Contract testing | Build plugin conformance tests on the existing `@kubb/core/mocks` subpath | The mocks were added for this purpose. A shared kit turns the implicit contract into an executable one that fails fast on drift. |
| Output stability | Treat byte-identical generated output as a release gate for every slice | The whole feature is a refactor. Snapshots and examples are the safety net, so each slice re-runs them. |

## Operating constraints

- No change to generated output. Existing snapshots and example outputs are the reference.
- The work spans two repositories, kubb and plugins. Core-side changes land first, then plugin-side consumption, without breaking the published beta.
- ESM only, Node 22. The oxlint, oxfmt, tsdown, and Vitest setup stays as is.
- Public API changes go through changesets. Removing the `react-reconciler` dependency from `@kubb/renderer-jsx` is at least a minor.
- `@kubb/ast` stays a leaf with no internal `@kubb/*` dependencies.

## What this means for the slices

- Slice 001 pins the current dependency graph before anything moves, so later refactors cannot silently regress it.
- Slices 002 and 003 are sequenced. Prove the builder path first, then remove the reconciler.
- Slice 004 starts only after the emit path is stable, so the kit extraction does not fight the render change.
- Every slice verification re-runs the snapshot and example suite as the output-stability gate for AC-7.
