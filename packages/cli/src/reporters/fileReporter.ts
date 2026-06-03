import { relative, resolve } from 'node:path'
import process from 'node:process'
import { formatMs, write } from '@internals/utils'
import { defineLogger } from '@kubb/core'
import { formatDiagnostic } from '../loggers/diagnostics.ts'

type CachedEvent = {
  /**
   * Timestamp when this event was captured, used to derive the log filename.
   */
  date: Date
  /**
   * Accumulated log lines for this event.
   */
  logs: Array<string>
}

/**
 * The `file` reporter. Captures lifecycle, problem, and `debug` diagnostics and writes
 * them to `.kubb/<name>-<timestamp>.log`. Selected with `--reporter file` (or
 * `reporters: ['file']`), replacing the old `--debug` flag.
 *
 * @note Logs are written on `kubb:generation:end` or process exit. Cached logs may be lost if the process crashes before either event.
 */
export const fileReporter = defineLogger({
  name: 'file',
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

      const baseName = `${['kubb', name, state.startDate].filter(Boolean).join('-')}.log`
      const pathName = resolve(process.cwd(), '.kubb', baseName)

      const lines: Array<string> = []
      for (const log of state.cachedLogs) {
        if (log.logs.length === 0) {
          continue
        }
        const prefix = `[${log.date.toLocaleString()}] `
        const indent = ' '.repeat(prefix.length)
        const [first, ...rest] = log.logs
        lines.push([prefix + first, ...rest.map((line) => indent + line)].join('\n'))
      }

      await write(pathName, lines.join('\n'))

      return [pathName]
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

    context.on('kubb:diagnostic', ({ diagnostic }) => {
      state.cachedLogs.add({
        date: new Date(),
        logs: formatDiagnostic(diagnostic),
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
