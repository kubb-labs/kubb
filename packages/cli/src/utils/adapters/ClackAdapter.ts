import * as clack from '@clack/prompts'
import type { Logger } from '@kubb/core/logger'
import { LogMapper } from '@kubb/core/logger'
import pc from 'picocolors'
import { defineLoggerAdapter } from './defineLoggerAdapter.ts'
import type { LoggerAdapterOptions } from './types.ts'

/**
 * Clack adapter for local TTY environments
 * Provides a beautiful CLI UI with flat structure inspired by Claude's CLI patterns
 * 
 * Key features:
 * - Task status icons (✓ success, ✗ error, ⚠ warning, ◐ in-progress)
 * - Single-level indentation for subtasks (Clack limitation)
 * - Contextual error messages with actionable suggestions
 * - Clear visual hierarchy with colors and symbols
 */
export const createClackAdapter = defineLoggerAdapter((options: LoggerAdapterOptions) => {
  const logLevel = options.logLevel
  const errorCount = { value: 0 }
  const warningCount = { value: 0 }

  return {
    name: 'clack',

    install(logger: Logger): void {
      // Main lifecycle events - use intro/outro
      logger.on('start', (message) => {
        clack.intro(pc.bold(message))
      })

      logger.on('stop', (message) => {
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

      // Step messages - show as in-progress tasks
      logger.on('step', (message) => {
        clack.log.step(pc.cyan(`◐ ${message}`))
      })

      // Success messages - show with checkmark
      logger.on('success', (message) => {
        clack.log.success(pc.green(`✓ ${message}`))
      })

      // Warning messages - show with warning icon and count
      logger.on('warning', (message) => {
        if (logLevel >= LogMapper.warn) {
          warningCount.value++
          clack.log.warning(`${pc.yellow('⚠')} ${message}`)
        }
      })

      // Error messages - show with error icon, count, and context
      logger.on('error', (message, error) => {
        errorCount.value++
        
        // Main error message
        clack.log.error(`${pc.red('✗')} ${pc.bold(message)}`)
        
        // Show error details with indentation (single level)
        if (error.message) {
          clack.log.message(`  ${pc.dim('└─')} ${pc.red(error.message)}`)
        }
        
        // Show stack trace in debug mode
        if (logLevel >= LogMapper.debug && error.stack) {
          const stackLines = error.stack.split('\n').slice(1, 4) // First 3 stack frames
          stackLines.forEach((line) => {
            clack.log.message(`     ${pc.dim(line.trim())}`)
          })
        }
      })

      // Info messages
      logger.on('info', (message) => {
        if (logLevel >= LogMapper.info) {
          clack.log.info(`${pc.blue('ℹ')} ${message}`)
        }
      })

      // Verbose messages
      logger.on('verbose', (message) => {
        if (logLevel >= LogMapper.verbose) {
          const formattedLogs = message.logs.join('\n')
          clack.log.message(pc.dim(formattedLogs))
        }
      })

      // Debug messages - show with category grouping
      logger.on('debug', (event) => {
        if (logLevel >= LogMapper.debug) {
          const prefix = event.category ? `[${event.category}]` : '[debug]'
          const formattedLogs = event.logs.join('\n')
          clack.log.message(`${pc.magenta(prefix)} ${pc.dim(formattedLogs)}`)
        }
      })

      // Plugin events - show as tasks with status
      logger.on('plugin:start', ({ pluginName }) => {
        clack.log.step(pc.cyan(`◐ Generating ${pluginName}...`))
      })

      logger.on('plugin:end', ({ pluginName, duration }) => {
        const durationStr = duration < 1000 
          ? `${duration}ms` 
          : `${(duration / 1000).toFixed(2)}s`
        clack.log.success(pc.green(`✓ ${pluginName} ${pc.dim(`(${durationStr})`)}`))
      })
    },

    cleanup(): void {
      // Clack doesn't require cleanup
    },
  }
})
