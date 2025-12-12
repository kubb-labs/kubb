import type { Logger } from '@kubb/core/logger'
import { LogMapper } from '@kubb/core/logger'
import type { LoggerAdapter, LoggerAdapterOptions } from './types.ts'

/**
 * Plain console adapter for non-TTY environments
 * Simple console.log output with indentation
 */
export class PlainAdapter implements LoggerAdapter {
  readonly name = 'plain'
  private logLevel: number
  private indentLevel = 0

  constructor(options: LoggerAdapterOptions) {
    this.logLevel = options.logLevel
  }

  private log(message: string, indent = this.indentLevel): void {
    const prefix = '  '.repeat(indent)
    console.log(`${prefix}${message}`)
  }

  setup(logger: Logger): void {
    // Main lifecycle
    logger.on('start', (message) => {
      this.log(message)
      this.indentLevel++
    })

    logger.on('stop', (message) => {
      this.indentLevel = Math.max(0, this.indentLevel - 1)
      this.log(message)
    })

    // Step messages
    logger.on('step', (message) => {
      this.log(`→ ${message}`)
    })

    // Success messages
    logger.on('success', (message) => {
      this.log(`✓ ${message}`)
    })

    // Warning messages
    logger.on('warning', (message) => {
      if (this.logLevel >= LogMapper.warn) {
        this.log(`⚠ ${message}`)
      }
    })

    // Error messages
    logger.on('error', (message, error) => {
      this.log(`✗ ${message}`)
      if (error) {
        console.error(error)
      }
    })

    // Info messages
    logger.on('info', (message) => {
      if (this.logLevel >= LogMapper.info) {
        this.log(message)
      }
    })

    // Verbose messages
    logger.on('verbose', (message) => {
      if (this.logLevel >= LogMapper.verbose) {
        const formattedLogs = message.logs.join('\n')
        this.log(formattedLogs)
      }
    })

    // Plugin events
    logger.on('plugin:start', ({ pluginName }) => {
      this.log(`Starting ${pluginName}...`)
      this.indentLevel++
    })

    logger.on('plugin:end', ({ pluginName, duration }) => {
      this.indentLevel = Math.max(0, this.indentLevel - 1)
      this.log(`${pluginName} completed in ${duration}ms`)
    })
  }

  cleanup(): void {
    this.indentLevel = 0
  }
}
