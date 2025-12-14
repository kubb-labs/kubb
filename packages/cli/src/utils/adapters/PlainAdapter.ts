import type { Logger } from '@kubb/core/logger'
import { LogMapper } from '@kubb/core/logger'
import { defineLoggerAdapter } from './defineLoggerAdapter.ts'
import type { LoggerAdapterOptions } from './types.ts'

/**
 * Plain console adapter for non-TTY environments
 * Simple console.log output with indentation
 */
export const createPlainAdapter = defineLoggerAdapter((options: LoggerAdapterOptions) => {
  const logLevel = options.logLevel
  let indentLevel = 0

  const log = (message: string, indent = indentLevel): void => {
    const prefix = '  '.repeat(indent)
    console.log(`${prefix}${message}`)
  }

  return {
    name: 'plain',

    install(logger: Logger): void {
      // Main lifecycle
      logger.on('start', (message, _opts) => {
        log(message)
        indentLevel++
      })

      logger.on('stop', (message, _opts) => {
        indentLevel = Math.max(0, indentLevel - 1)
        log(message)
      })

      // Step messages
      logger.on('step', (message, _opts) => {
        log(`→ ${message}`)
      })

      // Success messages
      logger.on('success', (message, _opts) => {
        log(`✓ ${message}`)
      })

      // Warning messages
      logger.on('warning', (message, _opts) => {
        if (logLevel >= LogMapper.warn) {
          log(`⚠ ${message}`)
        }
      })

      // Error messages
      logger.on('error', (message, error, _opts) => {
        log(`✗ ${message}`)
        if (error) {
          console.error(error)
        }
      })

      // Info messages
      logger.on('info', (message, _opts) => {
        if (logLevel >= LogMapper.info) {
          log(message)
        }
      })

      // Verbose messages
      logger.on('verbose', (message) => {
        if (logLevel >= LogMapper.verbose) {
          const formattedLogs = message.logs.join('\n')
          log(formattedLogs)
        }
      })

      // Plugin events
      logger.on('plugin:start', ({ pluginName }) => {
        log(`Starting ${pluginName}...`)
        indentLevel++
      })

      logger.on('plugin:end', ({ pluginName, duration }) => {
        indentLevel = Math.max(0, indentLevel - 1)
        log(`${pluginName} completed in ${duration}ms`)
      })
    },

    cleanup(): void {
      indentLevel = 0
    },
  }
})
