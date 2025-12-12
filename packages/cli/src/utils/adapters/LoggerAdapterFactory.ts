import { ClackAdapter } from './ClackAdapter.ts'
import { canUseTTY, isGitHubActions } from './envDetection.ts'
import { GitHubActionsAdapter } from './GitHubActionsAdapter.ts'
import { PlainAdapter } from './PlainAdapter.ts'
import type { LoggerAdapter, LoggerAdapterOptions } from './types.ts'

export type AdapterType = 'clack' | 'github-actions' | 'plain'

/**
 * Factory for creating logger adapters based on environment
 */
export class LoggerAdapterFactory {
  /**
   * Detect the best adapter for the current environment
   */
  static detectAdapter(): AdapterType {
    if (isGitHubActions()) {
      return 'github-actions'
    }
    if (canUseTTY()) {
      return 'clack'
    }
    return 'plain'
  }

  /**
   * Create an adapter instance
   */
  static create(type: AdapterType, options: LoggerAdapterOptions): LoggerAdapter {
    switch (type) {
      case 'clack':
        return new ClackAdapter(options)
      case 'github-actions':
        return new GitHubActionsAdapter(options)
      case 'plain':
        return new PlainAdapter(options)
      default:
        throw new Error(`Unknown adapter type: ${type}`)
    }
  }

  /**
   * Create an adapter using automatic detection
   */
  static createAuto(options: LoggerAdapterOptions): LoggerAdapter {
    const type = LoggerAdapterFactory.detectAdapter()
    return LoggerAdapterFactory.create(type, options)
  }
}
