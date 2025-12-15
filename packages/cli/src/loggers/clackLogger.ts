import * as clack from '@clack/prompts'
import { defineLogger, LogLevel } from '@kubb/core'
import pc from 'picocolors'

/**
 * Clack adapter for local TTY environments
 * Provides a beautiful CLI UI with flat structure inspired by Claude's CLI patterns
 *
 * Key features:
 * - Task status icons (✓ success, ✗ error, ⚠ warning, ◐ in-progress)
 * - Single-level indentation for subtasks (Clack limitation)
 * - Contextual error messages with actionable suggestions
 * - Clear visual hierarchy with colors and symbols
 * - Timestamped verbose logging for detailed operation tracing
 * - Category-based debug logging with color-coded prefixes
 * - Progress bars for plugin execution and file generation
 */
export const clackLogger = defineLogger({
  name: 'clack',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const errorCount = { value: 0 }
    const warningCount = { value: 0 }
    const activeProgress = new Map<string, any>()

    context.on('lifecycle:start', (message) => {
      clack.intro(pc.bold(message))
    })

    context.on('lifecycle:end', (message) => {
      // Show summary with error/warning counts if any
      if (errorCount.value > 0 || warningCount.value > 0) {
        const parts: string[] = []
        if (errorCount.value > 0) {
          parts.push(pc.red(`${errorCount.value} error${errorCount.value > 1 ? 's' : ''}`))
        }
        if (warningCount.value > 0) {
          parts.push(pc.yellow(`${warningCount.value} warning${warningCount.value > 1 ? 's' : ''}`))
        }
        clack.outro(`${message} ${pc.dim('with')} ${parts.join(pc.dim(' and '))}`)
      } else {
        clack.outro(pc.green(message))
      }
    })

    context.on('success', (message) => {
      clack.log.success(`${pc.green('✓')} ${message}`)
    })

    context.on('warn', (message) => {
      if (logLevel >= LogLevel.warn) {
        warningCount.value++
        clack.log.warn(`${pc.yellow('⚠')} ${message}`)
      }
    })

    context.on('error', (error, _opts) => {
      errorCount.value++
      clack.log.error(`${pc.red('✗')} ${pc.bold(error.message)}`)

      // Show error details with indentation
      if (error.message) {
        clack.log.message(`  ${pc.dim('└─')} ${pc.red(error.message)}`)
      }

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= LogLevel.debug && error.stack) {
        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          clack.log.message(`     ${pc.dim(frame.trim())}`)
        }
      }
    })

    context.on('info', (message) => {
      if (logLevel >= LogLevel.info) {
        clack.log.info(`${pc.blue('ℹ')} ${message}`)
      }
    })

    context.on('verbose', (message) => {
      if (logLevel >= LogLevel.verbose) {
        const timestamp = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        const formattedLogs = message.logs.map((log) => `  ${pc.dim('└─')} ${log}`).join('\n')

        clack.log.message(`${pc.dim(`[${timestamp}]`)} ${pc.cyan('verbose')}`)
        clack.log.message(formattedLogs)
      }
    })

    context.on('debug', (message) => {
      if (logLevel >= LogLevel.debug) {
        const category = message.category || 'debug'
        const prefix = pc.dim(`[${category}]`)
        const formattedLogs = message.logs.map((log) => `${prefix} ${log}`).join('\n')
        clack.log.message(formattedLogs)
      }
    })

    // Plugin lifecycle with progress bars
    context.on('plugin:start', (plugin) => {
      // Create progress bar for plugin execution
      const progressBar = clack.progress({
        style: 'block',
        max: 100,
        size: 30,
      })
      progressBar.start(`Generating ${plugin.name}...`)

      // Simulate gradual progress
      const interval = setInterval(() => {
        progressBar.advance()
      }, 50)

      activeProgress.set(plugin.name, { progressBar, interval })
    })

    context.on('plugin:end', (plugin, duration) => {
      const active = activeProgress.get(plugin.name)
      if (active) {
        clearInterval(active.interval)
        const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`
        active.progressBar.stop(`${plugin.name} completed in ${durationStr}`)
        activeProgress.delete(plugin.name)
      }
    })

    // File processing progress
    context.on('files:processing:start', (count) => {
      const progressBar = clack.progress({
        style: 'heavy',
        max: count,
        size: 30,
        indicator: undefined,
      })
      progressBar.start(`Writing ${count} files...`)
      activeProgress.set('files', { progressBar })
    })

    context.on('files:processing:update', () => {
      const active = activeProgress.get('files')
      if (active) {
        active.progressBar.advance()
      }
    })

    context.on('files:processing:end', () => {
      const active = activeProgress.get('files')
      if (active) {
        active.progressBar.stop('Files written successfully')
        activeProgress.delete('files')
      }
    })

    // Cleanup any remaining progress bars
    return () => {
      for (const [_key, active] of activeProgress) {
        if (active.interval) {
          clearInterval(active.interval)
        }
        if (active.progressBar) {
          active.progressBar.stop()
        }
      }
      activeProgress.clear()
    }
  },
})
