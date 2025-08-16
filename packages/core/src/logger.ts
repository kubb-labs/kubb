import { resolve } from 'node:path'
import type { ConsolaInstance, LogLevel } from 'consola'
import { createConsola } from 'consola'
import pc from 'picocolors'
import seedrandom from 'seedrandom'
import { write } from './fs/write.ts'
import { EventEmitter } from './utils/EventEmitter.ts'

type DebugEvent = { date: Date; logs: string[]; fileName?: string }

type Events = {
  start: [message: string]
  success: [message: string]
  error: [message: string, cause: Error]
  warning: [message: string]
  debug: [DebugEvent]
  info: [message: string]
  progress_start: [{ id: string; size: number; message?: string }]
  progressed: [{ id: string; message?: string }]
  progress_stop: [{ id: string }]
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

  events.on('debug', (message) => {
    if (message.logs.join('\n\n').length <= 100 && logLevel === LogMapper.debug) {
      console.log(message.logs.join('\n\n'))
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
