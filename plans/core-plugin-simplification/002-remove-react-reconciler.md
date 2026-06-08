# 002, remove the React reconciler

## Context

`@kubb/renderer-jsx` ships react, react-reconciler, and scheduler, and it carries two runtimes: `Runtime` on the fiber reconciler and `SyncRuntime` that walks JSX directly. The official plugins already set `renderer: jsxRendererSync`, the reconciler-free path. This slice removes the fiber runtime and its heavy dependencies once an audit confirms nothing depends on them, which is the largest single simplification in the feature.

## Goal (demonstrable outcome)

`@kubb/renderer-jsx` builds and every plugin snapshot passes with `react-reconciler` and `scheduler` absent from the dependency tree and the size budget reduced below the figure recorded at the start of this slice.

## Prerequisites

Slice 001.

## Steps

1. Record the starting point: the current `inlinedDependencies` (`react`, `react-reconciler`, `scheduler`) and the `size-limit` budget in `packages/renderer-jsx/package.json`.
2. Audit every plugin and example for `jsxRenderer` versus `jsxRendererSync`, and confirm no component relies on React hooks or suspense. Migrate any holdout to the sync path or the builder API first.
3. Delete `Runtime.tsx` and the react-reconciler `Renderer.ts`, and drop the `react-reconciler` and `scheduler` dependencies. Keep `SyncRuntime`, the components, the jsx-runtime, and `dom.ts` only where still used.
4. Decide on element creation: keep `react/jsx-runtime` for now, or point `jsxImportSource` at the package's own `jsx-runtime.ts` to drop React entirely. Record the larger of the two as an optional follow-up if it adds risk.
5. Lower the size-limit budget to the new figure and update the exports map if `Runtime` was public.
6. Run the full plugin and example suite.

## Files touched

- `packages/renderer-jsx/src/Runtime.tsx` (deleted)
- `packages/renderer-jsx/src/Renderer.ts` (deleted)
- `packages/renderer-jsx/src/createRenderer.tsx` (modified)
- `packages/renderer-jsx/src/index.ts` (modified)
- `packages/renderer-jsx/package.json` (modified: drop dependencies, lower budget)
- a changeset (minor or major) for `@kubb/renderer-jsx`

## Verification

1. `pnpm --filter @kubb/renderer-jsx build && pnpm --filter @kubb/renderer-jsx size-limit` is under the new budget.
2. `pnpm why react-reconciler` shows it is not installed.
3. The full snapshot and example suite produces identical output.

## Done criteria

- [ ] `react-reconciler` and `scheduler` are gone from `@kubb/renderer-jsx`
- [ ] The size budget is below the figure recorded in step 1
- [ ] All generated output is unchanged
- [ ] A changeset is added
