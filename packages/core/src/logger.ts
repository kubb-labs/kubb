import seedrandom from 'seedrandom'
import c, { createColors } from 'tinyrainbow'

import type { Ora } from 'ora'
import type { Formatter } from 'tinyrainbow'

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
      spinner.warn(c.yellow(message))
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

const defaultColours = ['black', 'blue', 'darkBlue', 'cyan', 'gray', 'green', 'darkGreen', 'magenta', 'red', 'darkRed', 'yellow', 'darkYellow'] as const

export function randomColour(text?: string, colours = defaultColours): string {
  if (!text) {
    return 'white'
  }

  const random = seedrandom(text)
  const colour = colours.at(Math.floor(random() * colours.length)) || 'white'

  return colour
}

export function randomCliColour(text?: string, colors = defaultColours): string {
  const colours = createColors(true)

  if (!text) {
    return colours.white(text)
  }

  const colour = randomColour(text, colors)
  const isDark = colour.includes('dark')
  const key = colour.replace('dark', '').toLowerCase() as keyof typeof colours
  const formatter: Formatter = colours[key] as Formatter

  if (isDark) {
    return c.bold(formatter(text))
  }

  if (typeof formatter !== 'function') {
    throw new Error('Formatter for picoColor is not of type function/Formatter')
  }
  return formatter(text)
}
