import type { Logger } from '@kubb/core/logger'

/**
 * Base interface for logger adapters
 * Allows different UI libraries to be plugged in
 */
export interface LoggerAdapter {
  /**
   * Initialize the adapter and set up event listeners
   */
  setup(logger: Logger): void

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
 * Options for creating a logger adapter
 */
export type LoggerAdapterOptions = {
  /**
   * Logger log level for filtering events
   */
  logLevel: number
}
