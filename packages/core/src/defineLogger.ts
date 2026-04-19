import type { Logger, LoggerOptions, UserLogger } from "./types.ts";

/**
 * Wraps a logger definition into a typed {@link Logger}.
 *
 * @example
 * export const myLogger = defineLogger({
 *   name: 'my-logger',
 *   install(context, options) {
 *     context.on('kubb:info', (message) => console.log('ℹ', message))
 *     context.on('kubb:error', (error) => console.error('✗', error.message))
 *   },
 * })
 */
export function defineLogger<Options extends LoggerOptions = LoggerOptions>(
  logger: UserLogger<Options>,
): Logger<Options> {
  return logger;
}
