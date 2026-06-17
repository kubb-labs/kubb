import type { AsyncEventEmitter } from '@internals/utils'
import type { KubbHooks } from '@kubb/core'

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
 * Event emitter handed to `Logger.install`. Use `.on('kubb:info', ...)` to
 * subscribe to build events.
 */
export type LoggerContext = AsyncEventEmitter<KubbHooks>

/**
 * Logger contract. A logger receives the build's event emitter and subscribes
 * to whichever lifecycle events it wants to forward to its destination
 * (console, file, remote service).
 */
export type Logger<TOptions extends LoggerOptions = LoggerOptions> = {
  /**
   * Display name used in diagnostics.
   */
  name: string
  /**
   * Called once per build with the shared event emitter. Subscribe to the
   * lifecycle events the logger wants to forward to its destination.
   */
  install: (context: LoggerContext, options?: TOptions) => void | Promise<void>
}

/**
 * Defines a typed logger. The `install` method subscribes to lifecycle events
 * on the shared emitter and forwards them to the logger's destination.
 *
 * @example
 * ```ts
 * import { defineLogger } from '@kubb/cli'
 *
 * export const myLogger = defineLogger({
 *   name: 'my-logger',
 *   install(context) {
 *     context.on('kubb:info', ({ message }) => console.log('ℹ', message))
 *     context.on('kubb:error', ({ error }) => console.error('✗', error.message))
 *   },
 * })
 * ```
 */
export function defineLogger<Options extends LoggerOptions = LoggerOptions>(logger: Logger<Options>): Logger<Options> {
  return logger
}
