import type { KubbHooks, Hookable } from '@kubb/core'

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
 * Hook emitter handed to `Logger.install`. Use `.hook('kubb:info', ...)` to
 * subscribe to build hooks.
 */
export type LoggerContext = Hookable<KubbHooks>

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
  install: (context: LoggerContext, options?: LoggerOptions) => void | Promise<void>
}
