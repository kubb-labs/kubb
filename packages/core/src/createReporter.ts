import type { Diagnostic } from './diagnostics.ts'

/**
 * A built-in reporter that renders a run's output.
 *
 * - `cli` writes the end-of-run summary to the terminal (the default).
 * - `json` writes a machine-readable report to stdout, for CI.
 * - `file` writes a debug log to `.kubb/<name>-<timestamp>.log`.
 */
export type ReporterName = 'cli' | 'json' | 'file'

/**
 * Reporter contract. Unlike a Logger, a reporter never sees the event emitter. It
 * receives the run's collected diagnostics through `report`, called once the run ends.
 * Everything about the run lives in the diagnostics: derive the status with
 * {@link Diagnostics.hasError} and the duration with {@link Diagnostics.duration}.
 */
export type Reporter = {
  /**
   * Display name used in diagnostics.
   */
  name: string
  /**
   * Called once per run with every collected diagnostic. Use it to write the report
   * to its destination (stdout, a file, a remote sink).
   */
  report: (diagnostics: ReadonlyArray<Diagnostic>) => void | Promise<void>
}

export type UserReporter = Reporter

/**
 * Defines a reporter. Identity at runtime; it exists for type inference and to mark the
 * value as a reporter, mirroring {@link defineLogger}. Wiring the reporter onto the run's
 * events is the host's job, so the reporter only ever deals with `report(diagnostics)`.
 *
 * @example
 * ```ts
 * import { createReporter, Diagnostics } from '@kubb/core'
 *
 * export const jsonReporter = createReporter({
 *   name: 'json',
 *   report(diagnostics) {
 *     const status = Diagnostics.hasError(diagnostics) ? 'failed' : 'success'
 *     const durationMs = Diagnostics.duration(diagnostics)
 *     process.stdout.write(`${JSON.stringify({ status, durationMs, diagnostics }, null, 2)}\n`)
 *   },
 * })
 * ```
 */
export function createReporter(reporter: UserReporter): Reporter {
  return reporter
}
