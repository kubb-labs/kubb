import { relative, resolve } from 'node:path'
import process from 'node:process'
import { formatMs, write } from '@internals/utils'
import { defineLogger } from '@kubb/core'

type CachedEvent = {
  /**
   * Timestamp when this event was captured, used to derive the log filename.
   */
  date: Date
  /**
   * Accumulated log lines for this event.
   */
  logs: Array<string>
  /**
   * Optional override for the output filename inside `.kubb/`. When omitted, the filename is derived from `date`.
   */
  fileName?: string
}

/**
 * FileSystem logger that captures debug events and writes them to `.kubb` directory files.
 *
 * @note Logs are written on `kubb:lifecycle:end` or process exit. Cached logs may be lost if the process crashes before either event.
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

      const files: Record<string, Array<string>> = {}

      for (const log of state.cachedLogs) {
        const baseName = log.fileName || `${['kubb', name, state.startDate].filter(Boolean).join('-')}.log`
        const pathName = resolve(process.cwd(), '.kubb', baseName)

        if (!files[pathName]) {
          files[pathName] = []
        }

        if (log.logs.length > 0) {
          const prefix = `[${log.date.toLocaleString()}] `
          const indent = ' '.repeat(prefix.length)
          const [first, ...rest] = log.logs
          files[pathName].push([prefix + first, ...rest.map((line) => indent + line)].join('\n'))
        }
      }

      for (const [fileName, logs] of Object.entries(files)) {
        await write(fileName, logs.join('\n'))
      }

      return Object.keys(files)
    }

    context.on('kubb:info', ({ message, info }) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`ℹ ${[message, info].filter(Boolean).join(' ')}`],
      })
    })

    context.on('kubb:success', ({ message, info }) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`✓ ${[message, info].filter(Boolean).join(' ')}`],
      })
    })

    context.on('kubb:warn', ({ message, info }) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`⚠ ${[message, info].filter(Boolean).join(' ')}`],
      })
    })

    context.on('kubb:error', ({ error }) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`✗ ${error.message}`, error.stack || 'unknown stack'],
      })
    })

    context.on('kubb:debug', ({ date, fileName, logs, namespace }) => {
      const [first, ...rest] = logs
      state.cachedLogs.add({
        date,
        fileName,
        logs: first !== undefined ? [`${namespace} ${first}`, ...rest] : logs,
      })
    })

    context.on('kubb:plugin:start', ({ plugin }) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`► Generating ${plugin.name}`],
      })
    })

    context.on('kubb:plugin:end', ({ plugin, duration, success }) => {
      const durationStr = formatMs(duration)

      state.cachedLogs.add({
        date: new Date(),
        logs: [success ? `✓ ${plugin.name} completed in ${durationStr}` : `✗ ${plugin.name} failed in ${durationStr}`],
      })
    })

    context.on('kubb:files:processing:start', ({ files }) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: [`► Writing ${files.length} files`, ...files.map((file) => `  ${file.path}`)],
      })
    })

    context.on('kubb:generation:end', async ({ config }) => {
      const writtenFilePaths = await writeLogs(config.name)
      if (writtenFilePaths.length > 0) {
        const files = writtenFilePaths.map((f) => relative(process.cwd(), f))
        await context.emit('kubb:info', { message: 'Debug files written to:', info: files.join(', ') })
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
