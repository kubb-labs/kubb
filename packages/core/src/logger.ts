import seedrandom from 'seedrandom'
import c, { createColors } from 'tinyrainbow'

import { EventEmitter } from './utils/EventEmitter.ts'

import { type ConsolaInstance, createConsola, type LogLevel } from 'consola'
import type { Formatter } from 'tinyrainbow'

type Events = {
  start: [message: string]
  success: [message: string]
  error: [message: string, cause: Error]
  warning: [message: string]
  debug: [logs: string[]]
  info: [message: string]
  progress: [count: number, size: number]
}

export const LogMapper = {
  silent: Number.NEGATIVE_INFINITY,
  info: 3,
  debug: 4,
} as const

export type Logger = {
  /**
   * Optional config name to show in CLI output
   */
  name?: string
  logLevel: LogLevel
  consola?: ConsolaInstance
  on: EventEmitter<Events>['on']
  emit: EventEmitter<Events>['emit']
}

type Props = {
  name?: string
  logLevel?: LogLevel
  consola?: ConsolaInstance
}

export function createLogger({ logLevel = 3, name, consola: _consola }: Props = {}): Logger {
  const events = new EventEmitter<Events>()

  const consola =
    _consola ||
    createConsola({
      level: logLevel,
      formatOptions: {
        colors: true,
        date: true,
        columns: 120,
        compact: logLevel !== LogMapper.debug,
      },
    }).withTag(name ? randomCliColour(name) : '')

  consola?.wrapConsole()

  events.on('start', (message) => {
    consola.start(message)
  })

  events.on('success', (message) => {
    consola.success(message)
  })

  events.on('warning', (message) => {
    consola.warn(c.yellow(message))
  })

  events.on('info', (message) => {
    consola.info(c.yellow(message))
  })

  events.on('debug', (message) => {
    consola.debug(c.yellow(message))
  })

  events.on('error', (message, cause) => {
    const error = new Error(message || 'Something went wrong')
    error.cause = cause

    throw error
  })

  if (consola) {
    consola.level = logLevel
  }

  const logger: Logger = {
    name,
    logLevel,
    consola,
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
