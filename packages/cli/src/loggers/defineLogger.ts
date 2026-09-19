import type { KubbHooks, Hookable, SummaryRenderer } from '@kubb/core'

/**
 * Options accepted by a logger's `install` callback.
 */
export type LoggerOptions = {
  /**
   * Output verbosity. Use the `logLevel` constants exported from `@kubb/core`
   * (`silent`, `error`, `warn`, `info`, `verbose`).
   */
  logLevel: number
}

/**
 * Hook emitter handed to `Logger.install`. Use `.hook('kubb:info', ...)` to subscribe to build
 * hooks, or `.hook('studio:connected', ...)` for the Studio session events a `kubb studio`
 * connection emits on the same emitter.
 */
export type LoggerContext = Hookable<KubbHooks>

/**
 * What `Logger.install` hands back to its host. A logger that groups its output returns a
 * `renderSummary` so the `cli` reporter's summary lands inside that group instead of after it.
 */
export type LoggerHandle = {
  /**
   * Writes the `cli` reporter's summary lines through this logger's own output, and closes the
   * group the logger opened for that config.
   */
  renderSummary?: SummaryRenderer
}

/**
 * Logger contract. A logger receives the build's hook emitter and subscribes
 * to whichever lifecycle hooks it wants to forward to its destination
 * (console, file, remote service).
 */
export type Logger = {
  /**
   * Display name used in diagnostics.
   */
  name: string
  /**
   * Called once per build with the shared hook emitter. Subscribe to the
   * lifecycle hooks the logger wants to forward to its destination.
   */
  install: (context: LoggerContext, options?: LoggerOptions) => LoggerHandle | void | Promise<LoggerHandle | void>
}
