import type { CreateLoggerAdapter, LoggerAdapter, LoggerAdapterOptions } from './types.ts'

/**
 * Wraps a logger adapter builder to provide consistent structure and optional options.
 * Similar to definePlugin, this helper ensures all adapters follow the same pattern.
 */
export function defineLoggerAdapter<TOptions extends LoggerAdapterOptions = LoggerAdapterOptions>(
  build: (options: TOptions) => LoggerAdapter,
): CreateLoggerAdapter<TOptions> {
  return (options) => {
    const adapter = build(options ?? ({} as TOptions))

    return {
      name: adapter.name,
      install: adapter.install,
      cleanup: adapter.cleanup,
    }
  }
}
