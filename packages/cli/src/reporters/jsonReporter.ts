import process from 'node:process'
import { createReporter, type Diagnostic, Diagnostics, isPerformanceDiagnostic, isProblemDiagnostic, type SerializedDiagnostic } from '@kubb/core'

/**
 * A single problem in the machine-readable report: a {@link SerializedDiagnostic}
 * (JSON-safe fields plus the `docsUrl`), without the `performance` records.
 */
export type JsonReportDiagnostic = SerializedDiagnostic

/**
 * One plugin's elapsed time in the machine-readable report, derived from a `performance` record.
 */
export type JsonReportTiming = {
  plugin: string
  durationMs: number
}

/**
 * The stable shape emitted by `kubb generate --reporter json`, for CI tooling.
 */
export type JsonReport = {
  status: 'success' | 'failed'
  summary: {
    errors: number
    warnings: number
    durationMs: number
  }
  /**
   * Per-plugin durations, slowest first. Summed into `summary.durationMs`.
   */
  timings: Array<JsonReportTiming>
  diagnostics: Array<JsonReportDiagnostic>
}

/**
 * Builds the machine-readable report from the run's diagnostics. The `performance` records become
 * the `timings` list (slowest first) and their sum is `summary.durationMs`. The build is `failed`
 * when any error is present.
 */
export function buildJsonReport({ diagnostics }: { diagnostics: ReadonlyArray<Diagnostic> }): JsonReport {
  const timings = diagnostics
    .filter(isPerformanceDiagnostic)
    .sort((a, b) => b.duration - a.duration)
    .map((diagnostic) => ({ plugin: diagnostic.plugin, durationMs: diagnostic.duration }))
  const durationMs = timings.reduce((total, timing) => total + timing.durationMs, 0)
  const problems = diagnostics.filter(isProblemDiagnostic)
  const { errors, warnings } = Diagnostics.count(problems)

  return {
    status: errors > 0 ? 'failed' : 'success',
    summary: { errors, warnings, durationMs },
    timings,
    diagnostics: problems.map((diagnostic) => Diagnostics.serialize(diagnostic)),
  }
}

/**
 * The `json` reporter. Writes the {@link JsonReport} for the whole run to stdout. The terminal
 * reporter is suppressed while this is active so stdout stays valid JSON.
 */
export const jsonReporter = createReporter({
  name: 'json',
  report(result) {
    const report = buildJsonReport({ diagnostics: result.diagnostics })
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  },
})
