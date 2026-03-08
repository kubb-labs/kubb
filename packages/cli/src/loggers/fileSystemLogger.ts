import { relative, resolve } from 'node:path'
import process from 'node:process'
import { defineLogger } from '@kubb/core'
import { formatMs, write } from '@kubb/utils'

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
    const state = {
      cachedLogs: new Set<CachedEvent>(),
      startDate: Date.now(),
    }

    function reset() {
      state.cachedLogs = new Set<CachedEvent>()
      state.startDate = Date.now()
    }

    async function writeLogs(name?: string) {
      if (state.cachedLogs.size === 0) {
        return []
      }

      const files: Record<string, string[]> = {}

      for (const log of state.cachedLogs) {
        const baseName = log.fileName || `${['kubb', name, state.startDate].filter(Boolean).join('-')}.log`
        const pathName = resolve(process.cwd(), '.kubb', baseName)

        if (!files[pathName]) {
          files[pathName] = []
        }

        if (log.logs.length > 0) {
          const timestamp = log.date.toLocaleString()
          files[pathName].push(`[${timestamp}]\n${log.logs.join('\n')}`)
        }
      }

      await Promise.all(
        Object.entries(files).map(async ([fileName, logs]) => {
          return write(fileName, logs.join('\n\n'))
        }),
      )

      return Object.keys(files)
    }

    context.on('info', (message, info) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`ℹ ${message} ${info}`],
      })
    })

    context.on('success', (message, info) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`✓ ${message} ${info}`],
      })
    })

    context.on('warn', (message, info) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`⚠ ${message} ${info}`],
      })
    })

    context.on('error', (error) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`✗ ${error.message}`, error.stack || 'unknown stack'],
      })
    })

    context.on('debug', (message) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: message.logs,
      })
    })

    context.on('plugin:start', (plugin) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`Generating ${plugin.name}`],
      })
    })

    context.on('plugin:end', (plugin, { duration, success }) => {
      const durationStr = formatMs(duration)

      state.cachedLogs.add({
        date: new Date(),
        logs: [success ? `${plugin.name} completed in ${durationStr}` : `${plugin.name} failed in ${durationStr}`],
      })
    })

    context.on('files:processing:start', (files) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`Start ${files.length} writing:`, ...files.map((file) => file.path)],
      })
    })

    context.on('generation:end', async (config) => {
      const writtenFilePaths = await writeLogs(config.name)
      if (writtenFilePaths.length > 0) {
        const files = writtenFilePaths.map((f) => relative(process.cwd(), f))
        await context.emit('info', 'Debug files written to:', files.join(', '))
      }
      reset()
    })

    // Fallback: Write logs on process exit to handle crashes
    const exitHandler = () => {
      // Synchronous write on exit - best effort
      if (state.cachedLogs.size > 0) {
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
