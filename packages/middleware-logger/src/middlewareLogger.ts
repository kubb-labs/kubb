import { createLogger } from './createLogger.ts'

/**
 * Built-in name of the default {@link middlewareLogger}.
 */
export const middlewareLoggerName = 'middleware-logger'

/**
 * Default logger instance: a consola-backed middleware that auto-detects GitHub Actions and
 * inlines workflow command annotations on top of the human-readable output.
 *
 * @example
 * ```ts
 * import { middlewareLogger } from '@kubb/middleware-logger'
 *
 * await middlewareLogger.install(hooks, { logLevel: 3 })
 * ```
 */
export const middlewareLogger = createLogger()
