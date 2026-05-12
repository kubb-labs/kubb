import type { AsyncEventEmitter } from '@internals/utils'
import type { logLevel } from './constants.ts'
import type { KubbHooks } from './types.ts'

export type LoggerOptions = {
  /**
   * Log level for output verbosity.
   * @default 3
   */
  logLevel: (typeof logLevel)[keyof typeof logLevel]
}

/**
 * Shared context passed to plugins, parsers, and other internals.
 */
export type LoggerContext = AsyncEventEmitter<KubbHooks>

export type Logger<TOptions extends LoggerOptions = LoggerOptions, TInstallReturn = void> = {
  name: string
  install: (context: LoggerContext, options?: TOptions) => TInstallReturn | Promise<TInstallReturn>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions, TInstallReturn = void> = Logger<TOptions, TInstallReturn>

/**
 * Wraps a logger definition into a typed {@link Logger}.
 *
 * The optional second type parameter `TInstallReturn` allows loggers to return
 * a value from `install` — for example, a sink factory that the caller can
 * forward to hook execution.
 *
 * @example Basic logger
 * ```ts
 * export const myLogger = defineLogger({
 *   name: 'my-logger',
 *   install(context, options) {
 *     context.on('kubb:info', (message) => console.log('ℹ', message))
 *     context.on('kubb:error', (error) => console.error('✗', error.message))
 *   },
 * })
 * ```
 *
 * @example Logger that returns a hook sink factory
 * ```ts
 * export const myLogger = defineLogger<LoggerOptions, HookSinkFactory>({
 *   name: 'my-logger',
 *   install(context, options) {
 *     // … register event handlers …
 *     return (commandWithArgs) => ({ onStdout: console.log })
 *   },
 * })
 * ```
 */
export function defineLogger<Options extends LoggerOptions = LoggerOptions, TInstallReturn = void>(
  logger: UserLogger<Options, TInstallReturn>,
): Logger<Options, TInstallReturn> {
  return logger
}
