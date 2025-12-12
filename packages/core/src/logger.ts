import { resolve } from 'node:path'
import pc from 'picocolors'
import seedrandom from 'seedrandom'
import { write } from './fs/write.ts'
// import { endGroup, isGitHubActions, startGroup } from './utils/ciDetection.ts'
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
  success: [message: string]
  error: [message: string, error: Error]
  warning: [message: string]
  debug: [DebugEvent]
  verbose: [DebugEvent]
  info: [message: string]
  progress_start: [{ id: string; size: number; message?: string }]
  progressed: [{ id: string; message?: string }]
  progress_stop: [{ id: string }]
  plugin_start: [{ pluginName: string; pluginKey: unknown }]
  plugin_end: [{ pluginName: string; pluginKey: unknown; duration: number }]
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
  emit: EventEmitter<Events>['emit']
  writeLogs: () => Promise<void>
}

type Props = {
  name?: string
  logLevel?: LogLevel
}

export function createLogger({ logLevel = 3, name }: Props = {}): Logger {
  const events = new EventEmitter<Events>()
  const startDate = Date.now()
  const cachedLogs = new Set<DebugEvent>()

  // events.on('debug', (message) => {
  //   const fullLog = message.logs.join('\n')
  //
  //   if (logLevel >= LogMapper.debug) {
  //     // Handle plugin group markers in GitHub Actions
  //     if (isGitHubActions()) {
  //       if (message.pluginGroupMarker === 'start') {
  //         // Start a new plugin group
  //         const title = message.pluginName || 'Plugin'
  //         console.log(startGroup(title))
  //
  //         return undefined // Don't log the marker itself
  //       }
  //       if (message.pluginGroupMarker === 'end') {
  //         // End the plugin group
  //         console.log(endGroup())
  //
  //         return undefined // Don't log the marker itself
  //       }
  //
  //       // For setup/file operations that aren't plugin-specific, create individual groups
  //       if (!message.pluginName && message.category && ['setup', 'file'].includes(message.category)) {
  //         const firstLine = message.logs[0] || 'Debug Details'
  //         const title = firstLine.length > DEBUG_LOG_TITLE_MAX_LENGTH ? `${firstLine.substring(0, DEBUG_LOG_TITLE_MAX_LENGTH)}...` : firstLine
  //
  //         console.log(startGroup(title))
  //         console.log(pc.dim(fullLog))
  //         console.log(endGroup())
  //       } else {
  //         // Plugin-specific logs are shown inline within their plugin group
  //         // Non-categorized logs are shown inline
  //         consola.log(pc.dim(fullLog))
  //       }
  //     } else {
  //       // Non-CI environments - show all logs inline (except group markers)
  //       if (!message.pluginGroupMarker) {
  //         consola.log(pc.dim(fullLog))
  //       }
  //     }
  //   }
  //
  //   cachedLogs.add(message)
  // })
  //
  // events.on('error', (message, cause) => {
  //   const error = new Error(message || 'Something went wrong')
  //   error.cause = cause
  //
  //   throw error
  // })

  const logger: Logger = {
    name,
    logLevel,
    on(...args) {
      return events.on(...args)
    },
    emit(...args) {
      return events.emit(...args)
    },
    async writeLogs() {
      const files: Record<string, string[]> = {}

      cachedLogs.forEach((log) => {
        const fileName = resolve(process.cwd(), '.kubb', log.fileName || `kubb-${startDate}.log`)

        if (!files[fileName]) {
          files[fileName] = []
        }

        if (log.logs.length) {
          files[fileName] = [...files[fileName], `[${log.date.toLocaleString()}]: \n${log.logs.join('\n')}`]
        }
      })

      await Promise.all(
        Object.entries(files).map(async ([fileName, logs]) => {
          return write(fileName, logs.join('\n'))
        }),
      )
    },
  }

  logger.on('error', (message, cause) => {
    const error = new Error(message || 'Something went wrong')
    error.cause = cause

    throw error
  })

  logger.on('verbose', (message) => {
    cachedLogs.add(message)
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
