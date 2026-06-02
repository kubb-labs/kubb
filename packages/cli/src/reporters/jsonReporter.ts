import { type Diagnostic, type DiagnosticLocation, Diagnostics, type DiagnosticSeverity } from '@kubb/core'

/**
 * A single problem in the machine-readable report. Mirrors {@link Diagnostic}
 * without the `timing` records or the non-serializable `cause`.
 */
export type JsonReportDiagnostic = {
  code: string
  severity: DiagnosticSeverity
  message: string
  location?: DiagnosticLocation
  help?: string
  plugin?: string
}

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
    diagnostics: problems.map((diagnostic) => ({
      code: diagnostic.code,
      severity: diagnostic.severity,
      message: diagnostic.message,
      ...(diagnostic.location ? { location: diagnostic.location } : {}),
      ...(diagnostic.help ? { help: diagnostic.help } : {}),
      ...(diagnostic.plugin ? { plugin: diagnostic.plugin } : {}),
    })),
  }
}
