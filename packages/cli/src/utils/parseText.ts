import { LogLevel } from '@kubb/core'
import type { LogLevels } from '@kubb/core'

export function parseText(baseText: string, config: Partial<Record<LogLevels, string>>, logLevel: LogLevels = LogLevel.silent): string {
  return `${baseText}${config[logLevel] || ''}`
}
