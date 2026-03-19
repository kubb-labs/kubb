import type { Logger, LoggerOptions, UserLogger } from './types.ts'

/**
 * Wraps a logger definition into a typed {@link Logger}.
 *
 * @example
 * export const myLogger = createLogger({
 *   name: 'my-logger',
 *   install(context, options) {
 *     context.on('info', (message) => console.log('ℹ', message))
 *     context.on('error', (error) => console.error('✗', error.message))
 *   },
 * })
 */
export function createLogger<Options extends LoggerOptions = LoggerOptions>(logger: UserLogger<Options>): Logger<Options> {
  return {
    ...logger,
  }
}
