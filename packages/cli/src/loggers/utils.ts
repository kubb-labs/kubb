import type { Logger, LoggerContext, LoggerOptions } from '@kubb/core'
import { canUseTTY, isGitHubActions } from './envDetection.ts'
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
  clack: plainLogger,
  plain: plainLogger,
  'github-actions': plainLogger,
} as const satisfies Record<LoggerType, Logger>

export async function setupLogger(context: LoggerContext, { logLevel }: LoggerOptions): Promise<void> {
  const type = detectLogger()

  const logger = logMapper[type] as Logger

  if (!logger) {
    throw new Error(`Unknown adapter type: ${type}`)
  }

  const installer = logger.install

  await (installer as any)(context, { logLevel })
}
