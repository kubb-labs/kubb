import type { AsyncEventEmitter } from '@internals/utils'
import type { logLevel } from './constants.ts'
import type { KubbHooks } from './types.ts'

/**
 * Options accepted by a logger's `install` callback.
 */
export type LoggerOptions = {
  /**
   * Output verbosity. Use the `logLevel` constants exported from `@kubb/core`
   * (`silent`, `info`, `verbose`, `debug`).
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
 * (console, file, remote sink).
 */
export type Logger<TOptions extends LoggerOptions = LoggerOptions, TInstallReturn = void> = {
  /**
   * Display name used in diagnostics.
   */
  name: string
  /**
   * Called once per build with the shared event emitter. Subscribe to events
   * here. The return value (if any) is forwarded to whoever installed the
   * logger — handy for sink factories.
   */
  install: (context: LoggerContext, options?: TOptions) => TInstallReturn | Promise<TInstallReturn>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions, TInstallReturn = void> = Logger<TOptions, TInstallReturn>

/**
 * Defines a typed logger. Use the second type parameter to declare a return
 * value from `install` — handy when the logger exposes a sink factory or
 * cleanup callback to the caller.
 *
 * @example Basic logger
 * ```ts
 * import { defineLogger } from '@kubb/core'
 *
 * export const myLogger = defineLogger({
 *   name: 'my-logger',
 *   install(context) {
 *     context.on('kubb:info', (message) => console.log('ℹ', message))
 *     context.on('kubb:error', (error) => console.error('✗', error.message))
 *   },
 * })
 * ```
 *
 * @example Logger that returns a hook sink factory
 * ```ts
 * import { defineLogger, type LoggerOptions } from '@kubb/core'
 * import type { HookSinkFactory } from './sinks'
 *
 * export const myLogger = defineLogger<LoggerOptions, HookSinkFactory>({
 *   name: 'my-logger',
 *   install(context) {
 *     // … register event handlers …
 *     return () => ({ onStdout: console.log })
 *   },
 * })
 * ```
 */
export function defineLogger<Options extends LoggerOptions = LoggerOptions, TInstallReturn = void>(
  logger: UserLogger<Options, TInstallReturn>,
): Logger<Options, TInstallReturn> {
  return logger
}
