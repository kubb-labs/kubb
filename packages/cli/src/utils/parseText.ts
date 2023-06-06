import type { LogLevel } from '@kubb/core'

export function parseText(baseText: string, config: Partial<Record<LogLevel, string>>, logLevel: LogLevel = 'silent') {
  return `${baseText}${config[logLevel] || ''}`
}
