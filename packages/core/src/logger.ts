import { resolve } from 'node:path'
import type { ConsolaInstance, LogLevel } from 'consola'
import { createConsola } from 'consola'
import pc from 'picocolors'
import seedrandom from 'seedrandom'
import { write } from './fs/write.ts'
import { endGroup, isGitHubActions, startGroup } from './utils/ciDetection.ts'
import { EventEmitter } from './utils/EventEmitter.ts'

type DebugEvent = { date: Date; logs: string[]; fileName?: string }

type Events = {
  start: [message: string]
  success: [message: string]
  error: [message: string, cause: Error]
  warning: [message: string]
  debug: [DebugEvent]
  verbose: [DebugEvent]
  info: [message: string]
  progress_start: [{ id: string; size: number; message?: string }]
  progressed: [{ id: string; message?: string }]
  progress_stop: [{ id: string }]
}

export const LogMapper = {
  silent: Number.NEGATIVE_INFINITY,
  error: 0,
  warn: 1,
  info: 3,
  verbose: 4,
  debug: 5,
} as const

// Debug log configuration
const DEBUG_LOG_INLINE_THRESHOLD = 100 // Characters - logs shorter than this are shown inline
const DEBUG_LOG_TITLE_MAX_LENGTH = 50 // Characters - max length for group titles

export type Logger = {
  /**
   * Optional config name to show in CLI output
   */
  name?: string
  logLevel: LogLevel
  consola?: ConsolaInstance
  on: EventEmitter<Events>['on']
  emit: EventEmitter<Events>['emit']
  writeLogs: () => Promise<string[]>
}

type Props = {
  name?: string
  logLevel?: LogLevel
  consola?: ConsolaInstance
}

export function createLogger({ logLevel = 3, name, consola: _consola }: Props = {}): Logger {
  const events = new EventEmitter<Events>()
  const startDate = Date.now()
  const cachedLogs = new Set<DebugEvent>()

  const consola =
    _consola ||
    createConsola({
      level: logLevel,
      formatOptions: {
        colors: true,
        date: true,
        columns: 80,
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
    consola.warn(pc.yellow(message))
  })

  events.on('info', (message) => {
    consola.info(pc.yellow(message))
  })

  events.on('verbose', (message) => {
    if (logLevel >= LogMapper.verbose) {
      const formattedLogs = message.logs.join('\n')
      consola.log(pc.dim(formattedLogs))
    }

    cachedLogs.add(message)
  })

  events.on('debug', (message) => {
    const fullLog = message.logs.join('\n\n')
    
    if (logLevel >= LogMapper.debug) {
      // In GitHub Actions, wrap longer debug logs in collapsible groups
      if (isGitHubActions() && fullLog.length > DEBUG_LOG_INLINE_THRESHOLD) {
        // Extract first line as title, or use a generic title
        const firstLine = message.logs[0] || 'Debug Details'
        const title = firstLine.length > DEBUG_LOG_TITLE_MAX_LENGTH 
          ? firstLine.substring(0, DEBUG_LOG_TITLE_MAX_LENGTH) + '...' 
          : firstLine
        
        console.log(startGroup(title))
        console.log(pc.dim(fullLog))
        console.log(endGroup())
      } else if (fullLog.length <= DEBUG_LOG_INLINE_THRESHOLD) {
        // Short logs are always shown inline
        consola.log(pc.dim(fullLog))
      }
    }

    cachedLogs.add(message)
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

        files[fileName] = [...files[fileName], `[${log.date.toLocaleString()}]: ${log.logs.join('\n\n')}`]
      })
      await Promise.all(
        Object.entries(files).map(async ([fileName, logs]) => {
          return write(fileName, logs.join('\n'))
        }),
      )

      return Object.keys(files)
    },
  }

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
