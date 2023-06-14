import type { LogLevels } from '@kubb/core'
import type { Ora } from 'ora'
import pc from 'picocolors'

export type LogType = 'error' | 'info' | 'warning'

export type Logger = {
  log: (message: string | null) => void
  error: (message: string | null) => void
  info: (message: string | null) => void
  warn: (message: string | null) => void
  spinner?: Ora
}

export function createLogger(spinner?: Ora): Logger {
  const log: Logger['log'] = (message) => {
    if (message && spinner) {
      spinner.text = message
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
    }
  }

  const info: Logger['warn'] = (message) => {
    if (message && spinner) {
      spinner.info(message)
    }
  }

  const logger: Logger = {
    log,
    error,
    warn,
    info,
    spinner,
  }

  return logger
}

export function canLogHierarchy(input: LogLevels | undefined, compareTo: LogLevels) {
  if (input === 'stacktrace') {
    return canLogHierarchy('info', compareTo)
  }
  return input === compareTo
}

export { default as pc } from 'picocolors'
