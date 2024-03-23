import seedrandom from 'seedrandom'
import c, { createColors } from 'tinyrainbow'

import { writeLog } from './fs/write.ts'
import { EventEmitter } from './utils/EventEmitter.ts'

import type { Ora } from 'ora'
import type { Formatter } from 'tinyrainbow'

export const LogLevel = {
  silent: 'silent',
  info: 'info',
  debug: 'debug',
} as const

export type LogLevel = keyof typeof LogLevel

type Events = {
  start: [message: string]
  end: [message: string]
  error: [message: string, cause: Error]
  warning: [message: string]
  debug: [logs: string[]]
}
export type Logger = {
  /**
   * Optional config name to show in CLI output
   */
  name?: string
  logLevel: LogLevel

  spinner?: Ora
  on: EventEmitter<Events>['on']
  emit: EventEmitter<Events>['emit']
}

type Props = {
  name?: string
  logLevel: LogLevel
  spinner?: Ora
}

export function createLogger({ logLevel, name, spinner }: Props): Logger {
  const events = new EventEmitter<Events>()

  events.on('start', (message) => {
    if (spinner) {
      spinner.start(message)
    }
  })

  events.on('end', (message) => {
    if (spinner) {
      spinner.suffixText = ''
      spinner.succeed(message)
    }
  })

  events.on('warning', (message) => {
    if (spinner) {
      spinner.warn(c.yellow(message))
    }
  })

  events.on('error', (message, cause) => {
    const error = new Error(message || 'Something went wrong')
    error.cause = cause

    throw error
  })

  events.on('debug', async (messages) => {
    await writeLog(messages.join('\n'))
  })

  const logger: Logger = {
    name,
    logLevel,
    spinner,
    on: (...args) => {
      return events.on(...args)
    },
    emit: (...args) => {
      return events.emit(...args)
    },
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
