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
 * How a run ended, which decides the symbol a group closes on.
 */
export type LogStatus = 'success' | 'failed'

/**
 * A step whose end is not known when it starts. Rich output animates it; plain output prints each
 * message it is given.
 */
export type WriterSpinner = {
  start: (text: string) => void
  message: (text: string) => void
  stop: (text: string) => void
  error: (text: string) => void
}

/**
 * A step with a known number of items to work through.
 */
export type WriterProgress = {
  start: (text: string) => void
  advance: (text: string) => void
  stop: (text: string) => void
}

/**
 * How one logger draws. {@link createLogger} decides what a run says and in what order; a writer
 * decides only how each line looks, so every logger reports the same run the same way.
 */
export type LoggerWriter = {
  /**
   * Opens a group. Every `group` is closed by a {@link LoggerWriter.groupEnd}.
   */
  group: (title: string) => void
  groupEnd: (text: string, status: LogStatus) => void
  step: (text: string) => void
  info: (text: string) => void
  success: (text: string) => void
  warn: (text: string) => void
  error: (text: string) => void
  /**
   * Lines belonging to the step above them, drawn as one block.
   */
  block: (lines: Array<string>) => void
  /**
   * A subprocess's own output, drawn outside the group so it reads as its block.
   */
  raw: (lines: Array<string>) => void
  /**
   * A coded diagnostic's headline and its indented detail rows.
   */
  diagnostic: (lines: Array<string>) => void
  /**
   * The "update available" notice, which gets a frame of its own where one can be drawn.
   */
  update: (lines: Array<string>, title: string) => void
  spinner: () => WriterSpinner
  progress: (max: number) => WriterProgress
}

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
