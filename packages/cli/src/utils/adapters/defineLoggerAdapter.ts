import type { CreateLoggerAdapter, LoggerAdapter, LoggerAdapterOptions } from './types.ts'

/**
 * Wraps a logger adapter builder to provide consistent structure and optional options.
 * Similar to definePlugin, this helper ensures all adapters follow the same pattern.
 */
export function defineLoggerAdapter<
  TOptions extends LoggerAdapterOptions = LoggerAdapterOptions,
  TAdapter extends LoggerAdapter = LoggerAdapter,
>(build: (options: TOptions) => TAdapter): CreateLoggerAdapter<TOptions, TAdapter> {
  return (options) => {
    return build(options ?? ({} as TOptions))
  }
}
