import type { AsyncEventEmitter } from '@internals/utils'
import type { logLevel } from './constants.ts'
import type { KubbHooks } from './types.ts'

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
 * Output sink for a hook subprocess, controlling how streamed lines and exit output are forwarded.
 */
type HookOutputSink = {
  /**
   * Called for each streamed stdout line while the hook runs.
   */
  onLine?: (line: string) => void
  /**
   * Called with stderr content after the hook exits with a non-zero code.
   */
  onStderr?: (text: string) => void
  /**
   * Called with stdout content after the hook exits with a non-zero code.
   */
  onStdout?: (text: string) => void
}

/**
 * Output sink combined with stream control for a hook subprocess.
 */
export type HookSinkOptions = HookOutputSink & {
  /**
   * When `true`, streams process output line-by-line via `onLine`.
   *
   * @default false
   */
  stream?: boolean
}

/**
 * Factory a logger may return from `install` to control how each hook subprocess's output is
 * captured and displayed. Called once per hook command. The function should set up any logger UI
 * and return callbacks that forward subprocess output to it.
 *
 * `hookId` is the same id passed to `kubb:hook:start` / `kubb:hook:end`, letting the logger
 * correlate streamed output with any active UI element it created in the start handler.
 */
export type HookSinkFactory = (commandWithArgs: string, hookId: string) => HookSinkOptions | null

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
   * logger, which is handy for sink factories.
   */
  install: (context: LoggerContext, options?: TOptions) => TInstallReturn | Promise<TInstallReturn>
}

export type UserLogger<TOptions extends LoggerOptions = LoggerOptions, TInstallReturn = void> = Logger<TOptions, TInstallReturn>

/**
 * Defines a typed logger. Use the second type parameter to declare a return
 * value from `install`, which is handy when the logger exposes a sink factory
 * or cleanup callback to the caller.
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
 * @example Logger that returns a hook sink factory
 * ```ts
 * import { defineLogger, type HookSinkFactory } from '@kubb/core'
 *
 * export const myLogger = defineLogger<{ logLevel: number }, HookSinkFactory>({
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
