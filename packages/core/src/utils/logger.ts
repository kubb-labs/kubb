import type { Ora } from 'ora'
import { throttle } from '../utils'
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
  const [log] = throttle<void, Parameters<Logger['log']>>((message) => {
    if (message && spinner) {
      spinner.text = message
    }
  }, 100)

  const [error] = throttle<void, Parameters<Logger['error']>>((message) => {
    if (message) {
      throw new Error(message || 'Something went wrong')
    }
  }, 100)

  const [warn] = throttle<void, Parameters<Logger['warn']>>((message) => {
    if (message && spinner) {
      spinner.warn(pc.yellow(message))
    }
  }, 100)

  const [info] = throttle<void, Parameters<Logger['warn']>>((message) => {
    if (message && spinner) {
      spinner.text = message
    }
  }, 100)

  const logger: Logger = {
    log,
    error,
    warn,
    info,
    spinner,
  }

  return logger
}

export { default as pc } from 'picocolors'
