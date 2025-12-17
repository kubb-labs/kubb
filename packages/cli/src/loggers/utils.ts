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

export async function setupLogger(context: LoggerContext, { logLevel }: LoggerOptions): Promise<void> {
  const type = detectLogger()

  const logger = logMapper[type] as Logger

  if (!logger) {
    throw new Error(`Unknown adapter type: ${type}`)
  }

  // Install primary logger
  const cleanup = await logger.install(context, { logLevel })

  if (logLevel >= LogLevel.debug) {
    await fileSystemLogger.install(context, { logLevel })
  }

  return cleanup
}
