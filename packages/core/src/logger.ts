import pc from 'picocolors'
import seedrandom from 'seedrandom'
import { EventEmitter } from './utils/EventEmitter.ts'

type DebugEvent = {
  date: Date
  logs: string[]
  fileName?: string
  /**
   * Category of the debug log, used for GitHub Actions grouping
   * - 'setup': Initial configuration and environment setup
   * - 'plugin': Plugin installation and execution
   * - 'hook': Plugin hook execution details
   * - 'schema': Schema parsing and generation
   * - 'file': File operations (read/write/generate)
   * - 'error': Error details and stack traces
   * - undefined: Generic logs (always inline)
   */
  category?: 'setup' | 'plugin' | 'hook' | 'schema' | 'file' | 'error'
  /**
   * Plugin name for grouping plugin-specific logs together
   */
  pluginName?: string
  /**
   * Indicates if this is the start or end of a plugin's execution
   * - 'start': Start of plugin execution group
   * - 'end': End of plugin execution group
   */
  pluginGroupMarker?: 'start' | 'end'
}

type Events = {
  start: [message: string]
  stop: [message: string]
  success: [message: string]
  error: [message: string, error: Error]
  warning: [message: string]
  step: [message: string]
  debug: [DebugEvent]
  verbose: [DebugEvent]
  info: [message: string]
  'progress:start': [{ id: string; size: number; message?: string }]
  progressed: [{ id: string; message?: string }]
  'progress:stop': [{ id: string }]
  'plugin:start': [{ pluginName: string; pluginKey: unknown }]
  'plugin:end': [{ pluginName: string; pluginKey: unknown; duration: number }]
}

/**
 * Defines the level of logs as specific numbers or special number types.
 *
 * @type {0 | 1 | 2 | 3 | 4 | 5 | (number & {})} LogLevel - Represents the log level.
 * @default 0 - Represents the default log level.
 */
export type LogLevel = 0 | 1 | 2 | 3 | 4 | 5 | (number & {})

export const LogMapper = {
  silent: Number.NEGATIVE_INFINITY,
  error: 0,
  warn: 1,
  info: 3,
  verbose: 4,
  debug: 5,
} as const

// const DEBUG_LOG_TITLE_MAX_LENGTH = 50 // Characters - max length for group titles

export type Logger = {
  /**
   * Optional config name to show in CLI output
   */
  name?: string
  logLevel: LogLevel
  on: EventEmitter<Events>['on']
  off: EventEmitter<Events>['off']
  emit: EventEmitter<Events>['emit']
}

type Props = {
  name?: string
  logLevel?: LogLevel
}

export function createLogger({ logLevel = 3, name }: Props = {}): Logger {
  const events = new EventEmitter<Events>()

  const logger: Logger = {
    name,
    logLevel,
    on(...args) {
      return events.on(...args)
    },
    off(...args) {
      return events.off(...args)
    },
    emit(...args) {
      return events.emit(...args)
    },
  }

  logger.on('error', (message, cause) => {
    const error = new Error(message || 'Something went wrong')
    error.cause = cause

    throw error
  })

  return logger
}

export function randomColour(text?: string): 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' {
  if (!text) {
    return 'white'
  }

  const defaultColours = ['black', 'red', 'green', 'yellow', 'blue', 'red', 'green', 'magenta', 'cyan', 'gray'] as const

  const random = seedrandom(text)
  const colour = defaultColours.at(Math.floor(random() * defaultColours.length)) || 'white'

  return colour
}

export function randomCliColour(text?: string): string {
  if (!text) {
    return ''
  }

  const colour = randomColour(text)

  const fn = pc[colour]
  return fn ? fn(text) : text
}
