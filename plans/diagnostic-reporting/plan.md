# Plan, diagnostic reporting completeness

> Phase 2. Extends the existing diagnostics model on this branch to match the reporting depth of
> tsc / oxlint / nx. The foundation is already in place; this adds the four missing pieces.

## Overview

The diagnostics model already collects problems and `timing` records into `BuildOutput.diagnostics`,
emits `kubb:diagnostic`, renders them oxlint-style, derives failure via `hasBuildError`, and feeds
the summary. What's missing versus tsc/oxlint/nx: an aggregate problem count, reporting every
problem in one run instead of aborting on the first, real `warning`/`info` problems, and a
machine-readable reporter. The keystone is one new primitive — reporting a diagnostic **without
throwing** — which unlocks report-all and non-error severities. Counting and the JSON reporter are
independent and read from the already-collected `diagnostics` array.

## Architecture

Already in place (do not rebuild):

- `Diagnostic` (`kind: 'problem' | 'timing'`, `severity`, `code`, `location`, `help`, `plugin`,
  `duration`), `DiagnosticError`, `toDiagnostic`, `createTimingDiagnostic`, `hasBuildError`,
  `getFailedPluginNames` — `packages/core/src/diagnostics.ts`; `diagnosticCode` catalog incl
  `KUBB_TIMING` — `packages/core/src/constants.ts`.
- Collection: `KubbDriver.run()` builds the `diagnostics` array (per-plugin catch +
  `createTimingDiagnostic`); `BuildOutput.diagnostics` is the only result channel; `build()` throws
  via `hasBuildError`.
- Emission + render: `runners/generate/run.ts` loops diagnostics — `timing` → summary,
  `KUBB_UNKNOWN` → `kubb:error`, the rest → `kubb:diagnostic`, rendered by `formatDiagnostic`
  (`cli/src/loggers/diagnostics.ts`). Exit code `1` via `hasBuildError`.
- `getSummary` (`cli/src/loggers/utils.ts`) already receives `diagnostics` and renders per-plugin
  timing bars.

New responsibilities:

- **Collector** — `KubbDriver` exposes `reportDiagnostic(d)` that pushes onto the run's array, surfaced
  on the generator/resolver context and through `Adapter.parse` options. Reported `error`-severity
  diagnostics fail the build through the existing `hasBuildError`; no separate failure path.
- **Counting** — `getSummary` counts `problem` diagnostics by severity; loggers print a
  `Found N errors, M warnings` headline.
- **Sources** — the OAS adapter reports (not throws) unresolved refs and emits warning/info problems.
- **Reporter** — a `json` reporter serializes `BuildOutput.diagnostics` for CI.

## Slices

Copy `templates/slice.md` to `plans/diagnostic-reporting/NNN-<slug>.md` per slice.

| Slice | Name | Outcome |
| ----- | ---- | ------- |
| 001 | reportDiagnostic collector | `KubbDriver.reportDiagnostic` + a context method + `Adapter.parse(source, { reportDiagnostic })`; a reported error fails the build via `hasBuildError`; reported + thrown are deduped by `code + pointer + plugin`. |
| 002 | aggregate count summary | `getSummary` counts `problem` diagnostics by severity and adds an `Issues:` row; clack/plain/github summary handlers print a `✗ Found N errors, M warnings` headline (omitted when zero); a final total across configs in `run.ts`. |
| 003 | report-all refs + real severities | `adapter-oas/src/refs.ts` reports each unresolved `$ref` and continues (all surface in one run); emit `KUBB_UNSUPPORTED_FORMAT` (warning) and `KUBB_DEPRECATED` (info); add both codes to `diagnosticCode`. |
| 004 | machine-readable reporter | `--reporter <human\|json>` (default human) + optional `--report <file>` on `commands/generate.ts`; new `cli/src/loggers/jsonReporter.ts` serializing `{ status, summary: { errors, warnings, files, durationMs }, diagnostics }`; skip the human logger when json. |

Order: 002 and 004 are independent of 001; 003 depends on 001's collector.

### Slice 001 — reportDiagnostic collector

- `KubbDriver.reportDiagnostic(d: Diagnostic)` pushes onto the run array (near `run()` collection).
- Add `reportDiagnostic` to `GeneratorContext` (`defineGenerator.ts`) next to `warn`, built in
  `KubbDriver.getContext`.
- Extend `Adapter.parse` (`createAdapter.ts`) to `parse(source, options?: { reportDiagnostic })`,
  passed from `#parseInput`.
- Dedupe reported + thrown by `code + location.pointer + plugin` before they reach
  `BuildOutput.diagnostics`.

### Slice 002 — aggregate count

- In `getSummary` (`cli/src/loggers/utils.ts`) count `diagnostics.filter(d => d.kind !== 'timing')`
  by severity, add an `Issues: N errors, M warnings` row, return the counts.
- clack/plain/github `kubb:generation:summary` handlers print `✗ Found N errors, M warnings`
  (reusing `severityStyle` from `loggers/diagnostics.ts`); omit when zero.
- Final total across configs at the end of the run loop in `run.ts`.

### Slice 003 — report-all refs + severities

- `adapter-oas/src/refs.ts` reports `KUBB_REF_NOT_FOUND` via the collector and returns a fallback
  node instead of throwing; thread `reportDiagnostic` from the OAS parse entry (`adapter.ts` /
  `factory.ts`) into `refs.ts`/`resolvers.ts`.
- Emit `KUBB_UNSUPPORTED_FORMAT` (warning) for an unmapped schema `format`, and `KUBB_DEPRECATED`
  (info) for `deprecated: true`.
- Add `KUBB_UNSUPPORTED_FORMAT` and `KUBB_DEPRECATED` to `diagnosticCode` (`constants.ts`). Keep
  `KUBB_INVALID_SERVER_VARIABLE` / `KUBB_PLUGIN_NOT_FOUND` throwing (terminal).

### Slice 004 — machine-readable reporter

- `--reporter <human|json>` + `--report <file>` on `commands/generate.ts`.
- `cli/src/loggers/jsonReporter.ts` builds the object from `BuildOutput.diagnostics` (excluding
  `timing`) + counts; writes to stdout (or `--report` path). When json, skip the human logger in
  `setupLogger`. Exit code unchanged.

## Reuse (don't reinvent)

- `hasBuildError`, `getFailedPluginNames`, `createTimingDiagnostic`, `toDiagnostic`, `diagnosticCode`
  — `packages/core/src/diagnostics.ts`, `constants.ts`.
- `formatDiagnostic` + `severityStyle` — `packages/cli/src/loggers/diagnostics.ts`; `getSummary` and
  the clack box — `packages/cli/src/loggers/utils.ts`.
- The existing `warn` context method as the model for `reportDiagnostic` —
  `packages/core/src/defineGenerator.ts`.

## Verification

1. Spec with 3 dangling `$ref`s + 1 unsupported `format`: one `kubb generate` run prints 3 error
   blocks + 1 warning block, then `✗ Found 3 errors, 1 warning`, exits `1`.
2. `kubb generate --reporter json` prints the JSON (3 errors, 1 warning), exits `1`;
   `--report out.json` writes it and keeps human output.
3. Clean spec: no `Issues:` row, exit `0`, JSON `status: "success"` with empty `diagnostics`.

## Success criteria

- [ ] `reportDiagnostic` surfaces non-thrown diagnostics on `BuildOutput.diagnostics`; a reported
      error fails the build via `hasBuildError`.
- [ ] Summary shows `Found N errors, M warnings`; multiple bad `$ref`s report in one run; a
      `warning` and an `info` problem are emitted.
- [ ] `--reporter json` outputs the documented shape with correct exit codes; human output unchanged.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` green.
- [ ] Changeset added: `@kubb/core`, `@kubb/cli`, `@kubb/adapter-oas` (minor); kubb.dev docs pages
      for the two new codes.
