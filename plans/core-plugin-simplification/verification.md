# Verification: core and plugin complexity reduction

## Status summary

| Criterion | Requirement | Status |
| --- | --- | --- |
| AC-1 | A plugin import of `@kubb/adapter-oas` fails the CI boundary check with a named rule | PENDING |
| AC-2 | A builder-only generator emits identical files and imports no `@kubb/renderer-jsx` | PENDING |
| AC-3 | `react-reconciler` and `scheduler` are absent and the size budget is below baseline | PENDING |
| AC-4 | The framework plugins import shared logic from the kit and the duplicates are gone | PENDING |
| AC-5 | A broken resolver fails conformance, and every plugin passes when correct | PENDING |
| AC-6 | The creating-plugins guide is builder-first and names the three emit roles | PENDING |
| AC-7 | All snapshots and example output match the pre-feature baseline | PENDING |

---

## Setup

```bash
pnpm install
pnpm build
# baseline output to diff against later slices
pnpm test
```

---

## Section A. Feature-wide scenarios

### A.1 Boundary check rejects a cross-layer import

Covers **AC-1**.

1. Add `import { adapterOas } from '@kubb/adapter-oas'` to a plugin source.
2. Run `pnpm boundaries`.

Pass when: the command exits non-zero and names the forbidden plugin-to-adapter rule. Revert the import and it exits 0.

### A.2 Builder path emits identical output

Covers **AC-2**.

1. Run the chosen plugin's snapshot tests after the generator is converted to the builder API.
2. Search the generator module for a `@kubb/renderer-jsx` import.

Pass when: snapshots are unchanged and the search returns nothing.

### A.3 The reconciler is gone

Covers **AC-3**.

1. Run `pnpm why react-reconciler`.
2. Run `pnpm --filter @kubb/renderer-jsx size-limit`.

Pass when: react-reconciler is not installed and the size figure is below the baseline in `baseline.md`.

### A.4 Framework plugins are thinned

Covers **AC-4**.

1. Compare non-test source lines for react-query, vue-query, and swr against the baseline.
2. Confirm the shared helpers are imported from the kit and the old copies are deleted.

Pass when: each plugin's shared logic resolves to the kit and the line counts dropped.

### A.5 Conformance fails on drift

Covers **AC-5**.

1. Rename a resolver method in one plugin and run `pnpm test`.
2. Revert and run again.

Pass when: only that plugin fails on the rename, and all plugins pass after revert.

### A.6 Docs lead with the builder path

Covers **AC-6**.

1. Run `pnpm --filter kubb.dev build`.
2. Read the start of the creating-plugins guide and the roles section.

Pass when: the build compiles the examples, the first example uses the builder API, and the roles section names printer, renderer, and serializer.

### A.7 Output is unchanged

Covers **AC-7**.

1. After each slice, run the full snapshot and example suite.

Pass when: every snapshot and example output matches the pre-feature baseline.

---

## Section B. Per-slice scenarios

| Scenario | Criterion | Result |
| --- | --- | --- |
| B.1 | 001: boundary check in CI, planted violation fails, baseline recorded | PENDING |
| B.2 | 002: one generator emits identical output via builders, no JSX import | PENDING |
| B.3 | 003: reconciler and scheduler removed, budget down, output unchanged | PENDING |
| B.4 | 004: shared logic in one kit, three plugins thinned, output unchanged | PENDING |
| B.5 | 005: conformance green for all plugins, red on a broken resolver | PENDING |
| B.6 | 006: docs build builder-first with the roles section | PENDING |

---

## Section Z. Global verification

Run on _YYYY-MM-DD_ against _describe environment_.

| Check | Covers | Result |
| --- | --- | --- |
| `pnpm boundaries` (both repos) | A.1 | PENDING |
| `pnpm test` (kubb and plugins) | A.2, A.5, A.7 | PENDING |
| `pnpm why react-reconciler`, size-limit | A.3 | PENDING |
| line-count report | A.4 | PENDING |
| `pnpm --filter kubb.dev build` | A.6 | PENDING |
