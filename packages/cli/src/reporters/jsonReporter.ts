import process from 'node:process'
import { createReporter, type Diagnostic, Diagnostics, type SerializedDiagnostic } from '@kubb/core'

/**
 * A single problem in the machine-readable report: a {@link SerializedDiagnostic}
 * (JSON-safe fields plus the `docsUrl`), without the `timing` records.
 */
export type JsonReportDiagnostic = SerializedDiagnostic

/**
 * The stable shape emitted by `kubb generate --reporter json`, for CI tooling.
 */
export type JsonReport = {
  status: 'success' | 'failed'
  summary: {
    errors: number
    warnings: number
    files: number
    durationMs: number
  }
  diagnostics: Array<JsonReportDiagnostic>
}

/**
 * Builds the machine-readable report from the run's diagnostics. The file count and
 * duration are read from the run summary diagnostic; `timing` diagnostics are then
 * dropped. The build is `failed` when any error is present.
 */
export function buildJsonReport({ diagnostics }: { diagnostics: ReadonlyArray<Diagnostic> }): JsonReport {
  const durationMs = Diagnostics.duration(diagnostics)
  const files = Diagnostics.fileCount(diagnostics)
  const problems = diagnostics.filter((diagnostic) => diagnostic.kind !== 'timing')
  const { errors, warnings } = Diagnostics.count(problems)

  return {
    status: errors > 0 ? 'failed' : 'success',
    summary: { errors, warnings, files, durationMs },
    diagnostics: problems.map((diagnostic) => Diagnostics.serialize(diagnostic)),
  }
}

/**
 * The `json` reporter. Receives the run's collected diagnostics and file count, then writes
 * the {@link JsonReport} to stdout. The terminal reporter is suppressed while this is active
 * so stdout stays valid JSON.
 */
export const jsonReporter = createReporter({
  name: 'json',
  report(diagnostics) {
    const report = buildJsonReport({ diagnostics })
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  },
})
