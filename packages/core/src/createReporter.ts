import type { Config } from './types.ts'
import type { Diagnostic } from './Diagnostics.ts'

/**
 * Numeric log-level thresholds used internally to compare verbosity.
 *
 * Higher numbers are more verbose.
 */
export const logLevel = {
  silent: Number.NEGATIVE_INFINITY,
  error: 0,
  warn: 1,
  info: 3,
  verbose: 4,
} as const

/**
 * A built-in reporter that renders a run's output, independent of the live logger view.
 *
 * - `cli` renders the per-config summary to the terminal (the default).
 * - `json` writes a machine-readable report to stdout, for CI.
 * - `file` writes a config's diagnostics to `.kubb/kubb-<name>-<timestamp>.log`.
 */
export type ReporterName = 'cli' | 'json' | 'file'

/**
 * One config's outcome within a run, as handed to a {@link Reporter}.
 */
export type GenerationResult = {
  config: Config
  /**
   * Diagnostics collected while generating this config.
   */
  diagnostics: Array<Diagnostic>
  /**
   * Number of files written for this config.
   */
  filesCreated: number
  status: 'success' | 'failed'
  /**
   * `process.hrtime()` snapshot taken when this config started generating.
   */
  hrStart: [number, number]
}

/**
 * Render settings passed alongside the {@link GenerationResult}. These are not part of the run
 * data, such as the output verbosity.
 */
export type ReporterContext = {
  /**
   * Output verbosity. Use the `logLevel` constants exported from `@kubb/core`
   * (`silent`, `error`, `warn`, `info`, `verbose`).
   */
  logLevel: (typeof logLevel)[keyof typeof logLevel]
}

/**
 * Host-facing reporter, as installed onto a run. Unlike a Logger (the live TUI view), a reporter
 * never sees the hook emitter. `report` runs once per config. `drain`, when present, runs once
 * after the last config.
 */
export type Reporter = {
  /**
   * Display name, matching a {@link ReporterName} for the built-ins.
   */
  name: string
  /**
   * Called once per config with that config's result and the render context.
   */
  report: (result: GenerationResult, context: ReporterContext) => void | Promise<void>
  /**
   * Optional finalizer called once after the run's last config. The host wires it to
   * `kubb:lifecycle:end`. {@link createReporter} closes it over the values that `report` returned.
   */
  drain: (context: ReporterContext) => void | Promise<void>
  [Symbol.dispose](): void
}

/**
 * Reporter definition passed to {@link createReporter}. `report` returns the value to collect for
 * this config (e.g. a built report), and the optional `drain` receives the collected reports to
 * emit as one document. `T` is inferred from `report`'s return type.
 */
export type UserReporter<T = void> = {
  name: string
  report: (result: GenerationResult, context: ReporterContext) => T | Promise<T>
  drain?: (context: ReporterContext, reports: Array<T>) => void | Promise<void>
}

/**
 * Defines a reporter. The returned reporter buffers each value `report` returns in order and, when
 * the definition has a `drain`, hands the array to `drain` once and then clears it. Wiring the
 * reporter onto the run's hooks is the host's job, so the reporter only ever deals with a
 * {@link GenerationResult}.
 *
 * @example
 * ```ts
 * import { createReporter, Diagnostics } from '@kubb/core'
 *
 * export const jsonReporter = createReporter({
 *   name: 'json',
 *   report(result) {
 *     return { status: Diagnostics.hasError(result.diagnostics) ? 'failed' : 'success', diagnostics: result.diagnostics }
 *   },
 *   drain(context, reports) {
 *     process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`)
 *   },
 * })
 * ```
 */
export function createReporter<T = void>(reporter: UserReporter<T>): Reporter {
  const reports: Array<T> = []

  return {
    name: reporter.name,
    async report(result, context) {
      const report = await reporter.report(result, context)
      reports.push(report)
    },
    async drain(context) {
      await reporter.drain?.(context, reports)
      reports.length = 0
    },
    [Symbol.dispose]() {
      reports.length = 0
    },
  }
}
