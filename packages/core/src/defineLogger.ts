import type { AsyncEventEmitter } from '@internals/utils'
import type { KubbHooks } from './types.ts'

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
 * Options accepted by a logger's `install` callback.
 */
export type LoggerOptions = {
  /**
   * Output verbosity. Use the `logLevel` constants exported from `@kubb/core`
   * (`silent`, `error`, `warn`, `info`, `verbose`, `debug`).
   */
  logLevel: (typeof logLevel)[keyof typeof logLevel]
}

/**
 * Event emitter handed to `Logger.install`. Use `.on('kubb:info', ...)` and
 * friends to subscribe to build events.
 */
export type LoggerContext = AsyncEventEmitter<KubbHooks>

/**
 * Logger contract. A logger receives the build's event emitter and subscribes
 * to whichever lifecycle events it wants to forward to its destination
 * (console, file, remote service).
 */
export type Logger<TOptions extends LoggerOptions = LoggerOptions, TInstallReturn = void> = {
  /**
   * Display name used in diagnostics.
   */
  name: string
  /**
   * Called once per build with the shared event emitter. Subscribe to events
   * here. The return value (if any) is forwarded to whoever installed the
   * logger, which is handy for a cleanup callback.
   */
  install: (context: LoggerContext, options?: TOptions) => TInstallReturn | Promise<TInstallReturn>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions, TInstallReturn = void> = Logger<TOptions, TInstallReturn>

/**
 * Defines a typed logger. Use the second type parameter to declare a return
 * value from `install`, which is handy when the logger exposes a cleanup
 * callback to the caller.
 *
 * @example Basic logger
 * ```ts
 * import { defineLogger } from '@kubb/core'
 *
 * export const myLogger = defineLogger({
 *   name: 'my-logger',
 *   install(context) {
 *     context.on('kubb:info', ({ message }) => console.log('ℹ', message))
 *     context.on('kubb:error', ({ error }) => console.error('✗', error.message))
 *   },
 * })
 * ```
 *
 * @example Logger that returns a cleanup callback
 * ```ts
 * import { defineLogger, type LoggerOptions } from '@kubb/core'
 *
 * export const myLogger = defineLogger<LoggerOptions, () => void>({
 *   name: 'my-logger',
 *   install(context) {
 *     const handler = () => {}
 *     context.on('kubb:lifecycle:end', handler)
 *     return () => context.off('kubb:lifecycle:end', handler)
 *   },
 * })
 * ```
 */
export function defineLogger<Options extends LoggerOptions = LoggerOptions, TInstallReturn = void>(
  logger: UserLogger<Options, TInstallReturn>,
): Logger<Options, TInstallReturn> {
  return logger
}
