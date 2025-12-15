import type { Logger, LoggerContext, LoggerOptions } from '@kubb/core'
import { LogLevel } from '@kubb/core'
import { clackLogger } from './clackLogger.ts'
import { canUseTTY, isGitHubActions } from './envDetection.ts'
import { fileSystemLogger } from './fileSystemLogger.ts'
import { githubActionsLogger } from './githubActionsLogger.ts'
import { plainLogger } from './plainLogger.ts'
import type { LoggerType } from './types.ts'

export function detectLogger(): LoggerType {
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

export function getLoggerByEnvironment(): Logger {
  const type = detectLogger()
  return logMapper[type]
}

export async function setupLogger(context: LoggerContext, { logLevel }: LoggerOptions): Promise<void> {
  const type = detectLogger()

  const logger = logMapper[type] as Logger

  if (!logger) {
    throw new Error(`Unknown adapter type: ${type}`)
  }

  // Install primary logger
  const cleanup = await logger.install(context, { logLevel })

  // Also install fileSystemLogger in debug mode for log persistence
  if (logLevel >= LogLevel.debug) {
    const fsCleanup = await fileSystemLogger.install(context, { logLevel })
    
    // Combine cleanup functions
    const originalCleanup = cleanup
    return async () => {
      if (originalCleanup) {
        await originalCleanup()
      }
      if (fsCleanup) {
        await fsCleanup()
      }
    }
  }

  return cleanup
}
