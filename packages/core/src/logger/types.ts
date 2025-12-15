import type { KubbEvents } from '../Kubb.ts'
import type { AsyncEventEmitter } from '../utils/AsyncEventEmitter.ts'

/**
 * Defines the level of logs as specific numbers or special number types.
 *
 * @type {0 | 1 | 2 | 3 | 4 | 5 | (number & {})} LogLevel - Represents the log level.
 * @default 0 - Represents the default log level.
 */
export type LogLevel = 0 | 1 | 2 | 3 | 4 | 5 | (number & {})

export const LogMapper = {
  silent: Number.NEGATIVE_INFINITY,
  error: 0,
  warn: 1,
  info: 3,
  verbose: 4,
  debug: 5,
} as const

export type LogOptions = {
  /**
   * @default 3
   */
  logLevel: LogLevel
}

/**
 * Shared context passed to all plugins, parsers, and Fabric internals.
 */
interface LoggerContext extends AsyncEventEmitter<KubbEvents> {}

type Install<TOptions = unknown> = (context: LoggerContext, options?: TOptions) => void | Promise<void>

export type Logger<TOptions extends LogOptions = LogOptions> = {
  name: string

  install: Install<TOptions>
}

export type UserLogger<TOptions extends LogOptions = LogOptions> = Omit<Logger<TOptions>, 'logLevel'>
