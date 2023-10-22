import pc from 'picocolors'

import type { Ora } from 'ora'
import type { LogLevel } from '../index.ts'

export type LogType = 'error' | 'info' | 'warning'

export type Logger = {
  logLevel: LogLevel
  log: (message: string | null) => void
  error: (message: string | null) => void
  info: (message: string | null) => void
  warn: (message: string | null) => void
  spinner?: Ora
  logs: string[]
}

export function createLogger(logLevel: LogLevel, spinner?: Ora): Logger {
  const logs: string[] = []
  const log: Logger['log'] = (message) => {
    if (message && spinner) {
      spinner.text = message
      logs.push(message)
    }
  }

  const error: Logger['error'] = (message) => {
    if (message) {
      throw new Error(message || 'Something went wrong')
    }
  }

  const warn: Logger['warn'] = (message) => {
    if (message && spinner) {
      spinner.warn(pc.yellow(message))
      logs.push(message)
    }
  }

  const info: Logger['warn'] = (message) => {
    if (message && spinner) {
      spinner.info(message)
      logs.push(message)
    }
  }

  const logger: Logger = {
    logLevel,
    log,
    error,
    warn,
    info,
    spinner,
    logs,
  }

  return logger
}

export { default as pc } from 'picocolors'
