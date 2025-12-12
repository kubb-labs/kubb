import { createClackAdapter } from './ClackAdapter.ts'
import { canUseTTY, isGitHubActions } from './envDetection.ts'
import { createGitHubActionsAdapter } from './GitHubActionsAdapter.ts'
import { createPlainAdapter } from './PlainAdapter.ts'
import type { LoggerAdapter, LoggerAdapterOptions } from './types.ts'

export type AdapterType = 'clack' | 'github-actions' | 'plain'

/**
 * Detect the best adapter for the current environment
 */
export function detectAdapter(): AdapterType {
  if (isGitHubActions()) {
    return 'github-actions'
  }
  if (canUseTTY()) {
    return 'clack'
  }
  return 'plain'
}

/**
 * Create a logger adapter instance
 */
export function createLoggerAdapter(type: AdapterType, options: LoggerAdapterOptions): LoggerAdapter {
  switch (type) {
    case 'clack':
      return createClackAdapter(options)
    case 'github-actions':
      return createGitHubActionsAdapter(options)
    case 'plain':
      return createPlainAdapter(options)
    default:
      throw new Error(`Unknown adapter type: ${type}`)
  }
}

/**
 * Create a logger adapter using automatic environment detection
 */
export function createLoggerAdapterAuto(options: LoggerAdapterOptions): LoggerAdapter {
  const type = detectAdapter()
  return createLoggerAdapter(type, options)
}
