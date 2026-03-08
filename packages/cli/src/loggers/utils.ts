import { styleText } from 'node:util'
import type { Logger, LoggerContext, LoggerOptions } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import { formatHrtime } from '@kubb/core/utils'
import { canUseTTY, isGitHubActions } from '../utils/envDetection.ts'
import { clackLogger } from './clackLogger.ts'
import { fileSystemLogger } from './fileSystemLogger.ts'
import { githubActionsLogger } from './githubActionsLogger.ts'
import { plainLogger } from './plainLogger.ts'
import type { LoggerType } from './types.ts'

/**
 * Optionally prefix a message with a [HH:MM:SS] timestamp when logLevel >= verbose.
 * Shared across all logger adapters to avoid duplication.
 */
export function formatMessage(message: string, logLevel: number): string {
  if (logLevel >= logLevelMap.verbose) {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return `${styleText('dim', `[${timestamp}]`)} ${message}`
  }
  return message
}

type ProgressState = {
  totalPlugins: number
  completedPlugins: number
  failedPlugins: number
  totalFiles: number
  processedFiles: number
  hrStart: [number, number]
}

/**
 * Build the progress summary line shared by clack and GitHub Actions loggers.
 * Returns null when there is nothing to display.
 */
export function buildProgressLine(state: ProgressState): string | null {
  const parts: string[] = []
  const duration = formatHrtime(state.hrStart)

  if (state.totalPlugins > 0) {
    const pluginStr =
      state.failedPlugins > 0
        ? `Plugins ${styleText('green', state.completedPlugins.toString())}/${state.totalPlugins} ${styleText('red', `(${state.failedPlugins} failed)`)}`
        : `Plugins ${styleText('green', state.completedPlugins.toString())}/${state.totalPlugins}`
    parts.push(pluginStr)
  }

  if (state.totalFiles > 0) {
    parts.push(`Files ${styleText('green', state.processedFiles.toString())}/${state.totalFiles}`)
  }

  if (parts.length === 0) {
    return null
  }

  parts.push(`${styleText('green', duration)} elapsed`)
  return parts.join(styleText('dim', ' | '))
}

/**
 * Join a command and its optional args into a single display string.
 * e.g. ("prettier", ["--write", "."]) → "prettier --write ."
 */
export function formatCommandWithArgs(command: string, args?: readonly string[]): string {
  return args?.length ? `${command} ${args.join(' ')}` : command
}

function detectLogger(): LoggerType {
  if (isGitHubActions()) {
    return 'github-actions'
  }
  if (canUseTTY()) {
    return 'clack'
  }
  return 'plain'
}

const logMapper = {
  clack: clackLogger,
  plain: plainLogger,
  'github-actions': githubActionsLogger,
} as const satisfies Record<LoggerType, Logger>

export async function setupLogger(context: LoggerContext, { logLevel }: LoggerOptions): Promise<void> {
  const type = detectLogger()

  const logger = logMapper[type] as Logger

  if (!logger) {
    throw new Error(`Unknown adapter type: ${type}`)
  }

  // Install primary logger
  const cleanup = await logger.install(context, { logLevel })

  if (logLevel >= logLevelMap.debug) {
    await fileSystemLogger.install(context, { logLevel })
  }

  return cleanup
}
