import { defineLogger, LogLevel } from '@kubb/core'

/**
 * Plain console adapter for non-TTY environments
 * Simple console.log output with indentation
 */
export const plainLogger = defineLogger({
  name: 'plain',
  install(context, options) {
    const logLevel = options?.logLevel || 3
    let indentLevel = 0

    const log = (message: string, indent = indentLevel): void => {
      const prefix = '  '.repeat(indent)
      console.log(`${prefix}${message}`)
    }

    context.on('lifecycle:start', () => {
      log('Kubb started')
      indentLevel++
    })

    context.on('lifecycle:end', () => {
      indentLevel = Math.max(0, indentLevel - 1)
      log('Kubb completed')
    })

    context.on('success', (message) => {
      log(`✓ ${message}`)
    })

    context.on('warn', (message) => {
      if (logLevel >= LogLevel.warn) {
        log(`⚠ ${message}`)
      }
    })

    context.on('error', (error, _opts) => {
      log(`✗ ${error.message}`)
      if (error) {
        throw error
      }
    })

    context.on('info', (message) => {
      if (logLevel >= LogLevel.info) {
        log(message)
      }
    })

    context.on('verbose', (message) => {
      if (logLevel >= LogLevel.verbose) {
        log(message)
      }
    })

    context.on('debug', (message) => {
      if (logLevel >= LogLevel.debug) {
        const formattedLogs = message.logs.join('\n')
        log(formattedLogs)
      }
    })

    context.on('plugin:start', (plugin) => {
      log(`Starting ${plugin.name}...`)
      indentLevel++
    })

    context.on('plugin:end', (plugin, duration) => {
      indentLevel = Math.max(0, indentLevel - 1)
      log(`${plugin.name} completed in ${duration}ms`)
    })

    // No cleanup needed for plain logger, but return function for consistency
    return () => {
      // No-op cleanup
    }
  },
})
