import { resolve } from 'node:path'
import { defineLogger, LogLevel } from '@kubb/core'
import { write } from '@kubb/core/fs'

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

    context.on('debug', (message) => {
      cachedLogs.add({
        date: new Date(),
        logs: message.logs,
        fileName: undefined,
      })
    })

    if (logLevel >= LogLevel.verbose) {
      context.on('verbose', (message) => {
        cachedLogs.add({
          date: new Date(),
          logs: [message],
          category: 'verbose',
          fileName: undefined,
        })
      })
    }

    context.on('lifecycle:end', async () => {
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
    })
  },
})
