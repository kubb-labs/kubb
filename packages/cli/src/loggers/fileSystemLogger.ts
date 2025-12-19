import { resolve } from 'node:path'
import { defineLogger } from '@kubb/core'
import { write } from '@kubb/core/fs'
import { formatMs } from '@kubb/core/utils'

type CachedEvent = {
  date: Date
  logs: string[]
  fileName?: string
}

/**
 * FileSystem logger for debug log persistence
 * Captures debug and verbose events and writes them to files in .kubb directory
 *
 * Note: Logs are written on lifecycle:end or process exit. If the process crashes
 * before these events, some cached logs may be lost.
 */
export const fileSystemLogger = defineLogger({
  name: 'filesystem',
  install(context) {
    const cachedLogs: Set<CachedEvent> = new Set()
    const startDate = Date.now()

    async function writeLogs() {
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
          const timestamp = log.date.toLocaleString()
          files[fileName].push(`[${timestamp}]\n${log.logs.join('\n')}`)
        }
      }

      await Promise.all(
        Object.entries(files).map(async ([fileName, logs]) => {
          return write(fileName, logs.join('\n\n'))
        }),
      )

      cachedLogs.clear()
    }

    context.on('info', (message, info) => {
      cachedLogs.add({
        date: new Date(),
        logs: [`ℹ ${message} ${info}`],
        fileName: undefined,
      })
    })

    context.on('success', (message, info) => {
      cachedLogs.add({
        date: new Date(),
        logs: [`✓ ${message} ${info}`],
        fileName: undefined,
      })
    })

    context.on('warn', (message, info) => {
      cachedLogs.add({
        date: new Date(),
        logs: [`⚠ ${message} ${info}`],
        fileName: undefined,
      })
    })

    context.on('error', (error) => {
      cachedLogs.add({
        date: new Date(),
        logs: [`✗ ${error.message}`, error.stack || 'unknown stack'],
        fileName: undefined,
      })
    })

    context.on('debug', (message) => {
      cachedLogs.add({
        date: new Date(),
        logs: message.logs,
        fileName: undefined,
      })
    })

    context.on('plugin:start', (plugin) => {
      cachedLogs.add({
        date: new Date(),
        logs: [`Generating ${plugin.name}`],
        fileName: undefined,
      })
    })

    context.on('plugin:end', (plugin, { duration, success }) => {
      const durationStr = formatMs(duration)

      cachedLogs.add({
        date: new Date(),
        logs: [success ? `${plugin.name} completed in ${durationStr}` : `${plugin.name} failed in ${durationStr}`],
        fileName: undefined,
      })
    })

    context.on('files:processing:start', (files) => {
      cachedLogs.add({
        date: new Date(),
        logs: [`Start ${files.length} writing:`, ...files.map((file) => file.path)],
        fileName: undefined,
      })
    })

    context.on('lifecycle:end', async () => {
      await writeLogs()
    })

    // Fallback: Write logs on process exit to handle crashes
    const exitHandler = () => {
      // Synchronous write on exit - best effort
      if (cachedLogs.size > 0) {
        writeLogs().catch(() => {
          // Ignore errors on exit
        })
      }
    }

    process.once('exit', exitHandler)
    process.once('SIGINT', exitHandler)
    process.once('SIGTERM', exitHandler)
  },
})
