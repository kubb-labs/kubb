import { resolve } from 'node:path'
import { write } from '@kubb/core/fs'
import { defineLogger, LogLevel } from '@kubb/core'
import type { DebugEvent, VerboseEvent } from '@kubb/core/events'

type CachedEvent = {
  date: Date
  logs: string[]
  fileName?: string
  category?: string
  pluginName?: string
}

/**
 * FileSystem logger for debug log persistence
 * Captures debug and verbose events and writes them to files in .kubb directory
 * 
 * Key features:
 * - Persists debug logs to disk for troubleshooting
 * - Groups logs by fileName if specified
 * - Timestamped entries for operation tracing
 * - Supports custom log file naming via fileName option
 */
export const fileSystemLogger = defineLogger({
  name: 'filesystem',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const cachedLogs: Set<CachedEvent> = new Set()
    const startDate = Date.now()

    // Only capture logs if debug/verbose mode is enabled
    if (logLevel >= LogLevel.debug) {
      context.on('debug', (message: DebugEvent) => {
        cachedLogs.add({
          date: new Date(),
          logs: message.logs,
          category: message.category,
          fileName: undefined,
        })
      })
    }

    if (logLevel >= LogLevel.verbose) {
      context.on('verbose', (message: VerboseEvent) => {
        cachedLogs.add({
          date: new Date(),
          logs: message.logs,
          category: 'verbose',
          fileName: undefined,
        })
      })
    }

    // Cleanup function that writes logs to disk
    return async () => {
      if (cachedLogs.size === 0) {
        return
      }

      const files: Record<string, string[]> = {}

      for (const log of cachedLogs) {
        const fileName = resolve(process.cwd(), '.kubb', log.fileName || `kubb-${startDate}.log`)

        if (!files[fileName]) {
          files[fileName] = []
        }

        if (log.logs.length > 0) {
          const category = log.category ? `[${log.category}]` : ''
          const timestamp = log.date.toLocaleString()
          files[fileName].push(`[${timestamp}]${category ? ` ${category}` : ''}\n${log.logs.join('\n')}`)
        }
      }

      await Promise.all(
        Object.entries(files).map(async ([fileName, logs]) => {
          return write(fileName, logs.join('\n\n'))
        }),
      )

      cachedLogs.clear()
    }
  },
})
