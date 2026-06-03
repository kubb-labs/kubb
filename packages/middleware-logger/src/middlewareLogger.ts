import { createLogger } from './createLogger.ts'

declare global {
  namespace Kubb {
    /**
     * Marker that the consola + GitHub Actions logger from `@kubb/middleware-logger` is part of
     * this Kubb installation. Other packages can read this through the `Kubb` namespace if they
     * want to surface logger-specific options or recommendations.
     */
    interface LoggerRegistry {
      'middleware-logger': true
    }
  }
}

/**
 * Built-in name of the default {@link middlewareLogger}.
 */
export const middlewareLoggerName = 'middleware-logger'

/**
 * Default Kubb logger. A consola-backed middleware that auto-detects GitHub Actions and emits
 * inline workflow command annotations (`::group::`, `::endgroup::`, `::warning::`, `::error::`,
 * `::notice::`) alongside the human-readable output. Set it on `config.logger` in
 * `kubb.config.ts`, or omit it and let the `kubb` meta package pick it up automatically the same
 * way it picks up `middlewareBarrel`.
 *
 * @example Direct opt-in (works without the `kubb` meta package)
 * ```ts
 * import { middlewareLogger } from '@kubb/middleware-logger'
 *
 * export default {
 *   input: { path: './openapi.yaml' },
 *   output: { path: './src/gen' },
 *   logger: middlewareLogger,
 * }
 * ```
 *
 * @example Custom instance via {@link createLogger}
 * ```ts
 * import { createLogger } from '@kubb/middleware-logger'
 *
 * export default {
 *   logger: createLogger({ gha: false }),
 * }
 * ```
 */
export const middlewareLogger = createLogger()
