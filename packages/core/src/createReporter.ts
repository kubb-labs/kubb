import type { logLevel } from './constants.ts'
import type { Config } from './createKubb.ts'
import type { Diagnostic } from './diagnostics.ts'

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
 * Render context passed alongside the {@link GenerationResult}, carrying knobs a reporter needs
 * but that are not part of the run data (e.g. verbosity).
 */
export type ReporterContext = {
  /**
   * Output verbosity. Use the `logLevel` constants exported from `@kubb/core`
   * (`silent`, `error`, `warn`, `info`, `verbose`, `debug`).
   */
  logLevel: (typeof logLevel)[keyof typeof logLevel]
}

/**
 * Reporter contract. Unlike a Logger (the live TUI view), a reporter never sees the event
 * emitter. `report` is called once per config with its {@link GenerationResult} and produces
 * output (a terminal summary, a JSON report, a log file).
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
}

export type UserReporter = Reporter

/**
 * Defines a reporter. Returns the reporter unchanged at runtime. It exists for type inference and
 * to mark the value as a reporter, mirroring {@link defineLogger}. Wiring the reporter onto the
 * run's events is the host's job, so the reporter only ever deals with a {@link GenerationResult}.
 *
 * @example
 * ```ts
 * import { createReporter, Diagnostics } from '@kubb/core'
 *
 * export const jsonReporter = createReporter({
 *   name: 'json',
 *   report(result) {
 *     const status = Diagnostics.hasError(result.diagnostics) ? 'failed' : 'success'
 *     process.stdout.write(`${JSON.stringify({ status, diagnostics: result.diagnostics }, null, 2)}\n`)
 *   },
 * })
 * ```
 */
export function createReporter(reporter: UserReporter): Reporter {
  return reporter
}
