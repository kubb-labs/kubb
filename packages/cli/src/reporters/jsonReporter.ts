import process from 'node:process'
import { getElapsedMs } from '@internals/utils'
import { type Diagnostic, Diagnostics, type LoggerContext, type SerializedDiagnostic } from '@kubb/core'

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
 * Builds the machine-readable report from the run's diagnostics. `timing`
 * diagnostics are dropped; the build is `failed` when any error is present.
 */
export function buildJsonReport({ diagnostics, files, durationMs }: { diagnostics: ReadonlyArray<Diagnostic>; files: number; durationMs: number }): JsonReport {
  const problems = diagnostics.filter((diagnostic) => diagnostic.kind !== 'timing')
  const { errors, warnings } = Diagnostics.count(problems)

  return {
    status: errors > 0 ? 'failed' : 'success',
    summary: { errors, warnings, files, durationMs },
    diagnostics: problems.map((diagnostic) => Diagnostics.serialize(diagnostic)),
  }
}

/**
 * Installs the `json` reporter. Accumulates diagnostics and file counts across every
 * config in the run, then writes the {@link JsonReport} to stdout on `kubb:lifecycle:end`.
 * The terminal reporter is suppressed while this is active so stdout stays valid JSON.
 */
export function installJsonReporter(context: LoggerContext): void {
  const start = process.hrtime()
  const collected: { diagnostics: Array<Diagnostic>; files: number } = { diagnostics: [], files: 0 }

  context.on('kubb:generation:summary', ({ diagnostics, filesCreated }) => {
    collected.diagnostics.push(...diagnostics)
    collected.files += filesCreated
  })

  context.on('kubb:lifecycle:end', () => {
    const report = buildJsonReport({ diagnostics: collected.diagnostics, files: collected.files, durationMs: getElapsedMs(start) })
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  })
}
