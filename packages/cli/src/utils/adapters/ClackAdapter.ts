import * as clack from '@clack/prompts'
import type { Logger } from '@kubb/core/logger'
import { LogMapper } from '@kubb/core/logger'
import pc from 'picocolors'
import { defineLoggerAdapter } from './defineLoggerAdapter.ts'
import type { LoggerAdapterOptions } from './types.ts'

/**
 * Clack adapter for local TTY environments
 * Provides a beautiful CLI UI with flat structure (no nested groups)
 */
export const createClackAdapter = defineLoggerAdapter((options: LoggerAdapterOptions) => {
  const logLevel = options.logLevel

  return {
    name: 'clack',

    install(logger: Logger): void {
      // Main lifecycle events - use intro/outro
      logger.on('start', (message) => {
        clack.intro(message)
      })

      logger.on('stop', (message) => {
        clack.outro(message)
      })

      // Step messages
      logger.on('step', (message) => {
        clack.log.step(message)
      })

      // Success messages
      logger.on('success', (message) => {
        clack.log.success(message)
      })

      // Warning messages
      logger.on('warning', (message) => {
        if (logLevel >= LogMapper.warn) {
          clack.log.warning(pc.yellow(message))
        }
      })

      // Info messages
      logger.on('info', (message) => {
        if (logLevel >= LogMapper.info) {
          clack.log.info(pc.yellow(message))
        }
      })

      // Verbose messages
      logger.on('verbose', (message) => {
        if (logLevel >= LogMapper.verbose) {
          const formattedLogs = message.logs.join('\n')
          clack.log.message(pc.dim(formattedLogs))
        }
      })

      // Plugin events - flat structure with log.step/success
      logger.on('plugin:start', ({ pluginName }) => {
        clack.log.step(`Starting ${pluginName}...`)
      })

      logger.on('plugin:end', ({ pluginName, duration }) => {
        clack.log.success(`${pluginName} completed in ${duration}ms`)
      })
    },

    cleanup(): void {
      // Clack doesn't require cleanup
    },
  }
})
