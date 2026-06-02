---
'@kubb/core': minor
'@kubb/cli': minor
'@kubb/adapter-oas': minor
---

Round out diagnostic reporting toward tsc/oxlint/nx parity.

- **Report without throwing.** The diagnostics helpers are now a `Diagnostics` class. `Diagnostics.report(diagnostic)` collects into the active run instead of aborting — available on the generator context and, via a single `AsyncLocalStorage` in the core bundle, to deep code (adapter parse, lazily consumed streams). `Diagnostics.scope` activates a run; `Diagnostics.dedupe` collapses repeats by code + pointer + plugin. (`Diagnostics.from`/`timing`/`hasError`/`failedPlugins`/`count` replace the former standalone functions.)
- **Report every problem in one run.** The OAS adapter now reports each unresolved `$ref` and keeps parsing, so a spec with several bad refs surfaces them all in a single `kubb generate` (it still throws when called outside a build).
- **Aggregate count.** The end-of-run summary prints a `× Found N errors, M warnings` headline and an `Issues:` row, so parse-time errors that aren't tied to a failed plugin still show.
- **Machine-readable output.** `kubb generate --reporter json` prints a stable report (`{ status, summary: { errors, warnings, files, durationMs }, diagnostics }`) to stdout; `--report <file>` writes it to disk while keeping human output. Exit code is unchanged (non-zero on any error).
- New reserved codes `KUBB_UNSUPPORTED_FORMAT` (warning) and `KUBB_DEPRECATED` (info); the renderer, counts, and json report handle every severity.
