import pc from 'picocolors'

import type { Ora } from 'ora'

export const LogLevel = {
  silent: 'silent',
  info: 'info',
  debug: 'debug',
} as const

export type LogLevel = keyof typeof LogLevel

export type Logger = {
  /**
   * Optional config name to show in CLI output
   */
  name?: string
  logLevel: LogLevel
  log: (message: string | null) => void
  error: (message: string | null) => void
  info: (message: string | null) => void
  warn: (message: string | null) => void
  spinner?: Ora
  logs: string[]
}

type Props = {
  name?: string
  logLevel: LogLevel
  spinner?: Ora
}

export function createLogger({ logLevel, name, spinner }: Props): Logger {
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
    if (message && spinner && logLevel !== LogLevel.silent) {
      spinner.info(message)
      logs.push(message)
    }
  }

  const logger: Logger = {
    name,
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
