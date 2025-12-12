import type { Logger } from '@kubb/core/logger'
import type { LoggerAdapter } from './types.ts'

/**
 * GitHub Actions adapter for CI environments
 * Uses ::group:: and ::endgroup:: annotations for collapsible sections
 * Supports nested groups
 */
export class GitHubActionsAdapter implements LoggerAdapter {
  readonly name = 'github-actions'
  private activeGroups: Map<string, boolean> = new Map()

  setup(logger: Logger): void {
    // Main lifecycle - create main group
    logger.on('start', (message) => {
      console.log(`::group::${message}`)
      this.activeGroups.set('main', true)
    })

    logger.on('stop', (message) => {
      if (this.activeGroups.get('main')) {
        console.log('::endgroup::')
        this.activeGroups.delete('main')
      }
      console.log(message)
    })

    // Step messages
    logger.on('step', (message) => {
      console.log(message)
    })

    // Success messages
    logger.on('success', (message) => {
      console.log(`✓ ${message}`)
    })

    // Warning messages - use GitHub Actions annotation
    logger.on('warning', (message) => {
      console.log(`::warning::${message}`)
    })

    // Error messages - use GitHub Actions annotation
    logger.on('error', (message, error) => {
      console.log(`::error::${message}`)
      if (error) {
        console.error(error)
      }
    })

    // Info messages
    logger.on('info', (message) => {
      console.log(message)
    })

    // Verbose messages
    logger.on('verbose', (message) => {
      const formattedLogs = message.logs.join('\n')
      console.log(formattedLogs)
    })

    // Plugin events - create nested groups
    logger.on('plugin:start', ({ pluginName }) => {
      const groupKey = `plugin:${pluginName}`
      console.log(`::group::${pluginName}`)
      this.activeGroups.set(groupKey, true)
    })

    logger.on('plugin:end', ({ pluginName, duration }) => {
      const groupKey = `plugin:${pluginName}`
      console.log(`${pluginName} completed in ${duration}ms`)
      if (this.activeGroups.get(groupKey)) {
        console.log('::endgroup::')
        this.activeGroups.delete(groupKey)
      }
    })
  }

  cleanup(): void {
    // Close any remaining open groups
    this.activeGroups.forEach(() => {
      console.log('::endgroup::')
    })
    this.activeGroups.clear()
  }
}
