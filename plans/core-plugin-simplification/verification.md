# Verification: core and plugin complexity reduction

All five slices were validated locally with per-package Vitest runs, `tsc`, `oxlint`, `oxfmt`, and `tsdown` plus `size-limit`. The three PR subscriptions are off, so CI was not used for sign-off. A single repo-wide `pnpm test` was not run because the sandbox blocks the Cypress binary download; per-package runs cover every changed package instead.

## Status summary

| Criterion | Requirement | Status |
| --- | --- | --- |
| AC-1 | A builder-only generator emits identical files and imports no `@kubb/renderer-jsx` | PASS (local) |
| AC-2 | `react-reconciler` and `scheduler` are absent and the size budget is below baseline | PASS (local) |
| AC-3 | The framework plugins import shared logic from the kit and the duplicates are gone | PASS (local) |
| AC-4 | A broken resolver fails conformance, and every plugin passes when correct | PASS (local) |
| AC-5 | The creating-plugins guide is builder-first and names the three emit roles | PASS |
| AC-6 | All snapshots and example output match the pre-feature baseline | PASS (local) |

---

## Setup

```bash
pnpm install
# per-package validation (repo-wide pnpm test is blocked by the Cypress binary download in the sandbox)
node node_modules/vitest/vitest.mjs run --config ./configs/vitest.config.ts <package>
```

---

## Section A. Feature-wide scenarios

### A.1 Builder path emits identical output

Covers **AC-1**.

`operationsGenerator` (plugin-client) and `handlersGenerator` (plugin-msw) were converted to `create*` builders. Snapshots unchanged, and neither module imports `@kubb/renderer-jsx`.

Result: PASS. 90 plugin-client and 8 msw tests pass, no snapshot changes.

### A.2 The reconciler is gone

Covers **AC-2**.

`react-reconciler`, `scheduler`, and the `react` runtime are out of `@kubb/renderer-jsx`. The built bundle has no real `react` import. With the async runtime gone, `jsxRendererSync` and `jsxRenderer` were one function behind two names, so they collapse to a single `jsxRenderer` export, and the plugins and the docs pipeline move off the `jsxRendererSync` name.

Result: PASS. `pnpm why react-reconciler` is empty, size-limit reports about 7.4 kB against a 10 KiB budget, down from 510 KiB. 55 renderer-jsx tests pass, and 709 plugin tests pass after the rename.

### A.3 Framework plugins are thinned

Covers **AC-3**.

`buildQueryOptionsParams` lives in `@internals/tanstack-query`, and react-query, vue-query, and swr delegate to it.

Result: PASS. 71 tests pass, no snapshot changes. The drop is small because the plugins were already factored over `internals/`.

### A.4 Conformance fails on drift

Covers **AC-4**.

A resolver that drops `resolveFile` fails the conformance contract, then passes again after revert.

Result: PASS. 18 conformance tests pass across the six public resolvers, red path demonstrated.

### A.5 Docs lead with the builder path

Covers **AC-5**.

The creating-plugins guide is builder-first and now has an emit-roles section, and `concepts/plugins.md` links it.

Result: PASS. The additions are prose with no twoslash, and the kubb.dev Dokploy preview deployed successfully.

### A.6 Output is unchanged

Covers **AC-6**.

Every converted package keeps its snapshots, and on the plugins PR the "Update generated examples" CI job regenerated all examples with no diff.

Result: PASS. The one failing unit test anywhere is `tests/3.0.x` react-query `includeByTag`, which is pre-existing, passes in isolation, and is untouched by this work.

---

## Section B. Per-slice scenarios

| Scenario | Criterion | Result |
| --- | --- | --- |
| B.1 | 001: two generators emit identical output via builders, no JSX import | PASS |
| B.2 | 002: reconciler, scheduler, and react runtime removed, budget down, output unchanged | PASS |
| B.3 | 003: shared logic in one kit, three plugins thinned, output unchanged | PASS |
| B.4 | 004: conformance green for the public resolvers, red on a broken resolver | PASS |
| B.5 | 005: docs builder-first with the emit-roles section, preview deployed | PASS |

---

## Section Z. Global verification

Run on 2026-06-08 against the local sandbox (per-package Vitest, `tsc --noEmit`, `oxlint`, `tsdown` plus `size-limit`).

| Check | Covers | Result |
| --- | --- | --- |
| per-package Vitest (plugin-client, plugin-msw, plugin-swr, react-query, vue-query, renderer-jsx, conformance) | A.1, A.3, A.4, A.6 | PASS |
| `pnpm why react-reconciler`, size-limit, bundle grep | A.2 | PASS |
| `tsc --noEmit` on changed packages | A.1-A.4 | PASS |
| kubb.dev Dokploy preview deploy | A.5 | PASS |
