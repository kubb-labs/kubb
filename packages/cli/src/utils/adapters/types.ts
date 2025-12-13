import type { Logger } from '@kubb/core/logger'

/**
 * Logger adapter instance with lifecycle methods
 * Allows different UI libraries to be plugged in
 */
export type LoggerAdapter = {
  /**
   * Initialize the adapter and set up event listeners
   */
  install(logger: Logger): void

  /**
   * Clean up resources and close any open groups
   */
  cleanup(): void

  /**
   * Get the adapter name for debugging
   */
  readonly name: string
}

/**
 * Base options for creating a logger adapter
 */
export type LoggerAdapterOptions = {
  /**
   * Logger log level for filtering events
   */
  logLevel: number
}

/**
 * Factory function type for creating logger adapters
 */
export type CreateLoggerAdapter<
  TOptions extends LoggerAdapterOptions = LoggerAdapterOptions,
  TAdapter extends LoggerAdapter = LoggerAdapter,
> = (options: TOptions) => TAdapter
