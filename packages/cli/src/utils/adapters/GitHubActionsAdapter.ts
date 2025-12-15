import type { Logger } from '@kubb/core/logger'
import { defineLoggerAdapter } from './defineLoggerAdapter.ts'
import type { LoggerAdapterOptions } from './types.ts'

/**
 * GitHub Actions adapter for CI environments
 * Uses ::group:: and ::endgroup:: annotations for collapsible sections
 * Supports nested groups with group IDs
 */
export const createGitHubActionsAdapter = defineLoggerAdapter((_options: LoggerAdapterOptions) => {
  const activeGroups: Map<string, boolean> = new Map()

  return {
    name: 'github-actions',

    install(logger: Logger): void {
      // Main lifecycle - create main group
      logger.on('start', (message, opts) => {
        const groupId = opts?.groupId || 'main'
        console.log(`::group::${message}`)
        activeGroups.set(groupId, true)
      })

      logger.on('stop', (message, opts) => {
        const groupId = opts?.groupId || 'main'
        if (activeGroups.get(groupId)) {
          console.log('::endgroup::')
          activeGroups.delete(groupId)
        }
        console.log(message)
      })

      // Step messages - optionally within a group
      logger.on('step', (message, opts) => {
        if (opts?.groupId) {
          // If groupId is provided, ensure the group is open
          if (!activeGroups.get(opts.groupId)) {
            console.log(`::group::${opts.groupId}`)
            activeGroups.set(opts.groupId, true)
          }
        }
        console.log(message)
      })

      // Success messages
      logger.on('success', (message) => {
        console.log(`✓ ${message}`)
      })

      // Warning messages - use GitHub Actions annotation
      logger.on('warning', (message, opts) => {
        if (opts?.groupId && !activeGroups.get(opts.groupId)) {
          console.log(`::group::${opts.groupId}`)
          activeGroups.set(opts.groupId, true)
        }
        console.log(`::warning::${message}`)
      })

      // Error messages - use GitHub Actions annotation
      logger.on('error', (message, error, opts) => {
        if (opts?.groupId && !activeGroups.get(opts.groupId)) {
          console.log(`::group::${opts.groupId}`)
          activeGroups.set(opts.groupId, true)
        }
        console.log(`::error::${message}`)
        if (error) {
          console.error(error)
        }
      })

      // Info messages
      logger.on('info', (message, opts) => {
        if (opts?.groupId && !activeGroups.get(opts.groupId)) {
          console.log(`::group::${opts.groupId}`)
          activeGroups.set(opts.groupId, true)
        }
        console.log(message)
      })

      // Debug messages with group support
      logger.on('debug', (event) => {
        if (event.groupId && !activeGroups.get(event.groupId)) {
          console.log(`::group::${event.groupId}`)
          activeGroups.set(event.groupId, true)
        }

        const formattedLogs = event.logs.map((log) => `[${event.category || 'debug'}] ${log}`).join('\n')
        console.log(formattedLogs)

        // Auto-close group if this is a group marker
        if (event.groupId && event.pluginGroupMarker === 'end') {
          if (activeGroups.get(event.groupId)) {
            console.log('::endgroup::')
            activeGroups.delete(event.groupId)
          }
        }
      })

      // Verbose messages with group support
      logger.on('verbose', (event) => {
        if (event.groupId && !activeGroups.get(event.groupId)) {
          console.log(`::group::${event.groupId}`)
          activeGroups.set(event.groupId, true)
        }

        const formattedLogs = event.logs.join('\n')
        console.log(formattedLogs)

        // Auto-close group if this is a group marker
        if (event.groupId && event.pluginGroupMarker === 'end') {
          if (activeGroups.get(event.groupId)) {
            console.log('::endgroup::')
            activeGroups.delete(event.groupId)
          }
        }
      })

      // Plugin events - create nested groups
      logger.on('plugin:start', ({ pluginName, groupId }) => {
        const groupKey = groupId || `plugin:${pluginName}`
        console.log(`::group::${pluginName}`)
        activeGroups.set(groupKey, true)
      })

      logger.on('plugin:end', ({ pluginName, duration, groupId }) => {
        const groupKey = groupId || `plugin:${pluginName}`
        console.log(`${pluginName} completed in ${duration}ms`)
        if (activeGroups.get(groupKey)) {
          console.log('::endgroup::')
          activeGroups.delete(groupKey)
        }
      })
    },

    cleanup(): void {
      // Close any remaining open groups
      activeGroups.forEach(() => {
        console.log('::endgroup::')
      })
      activeGroups.clear()
    },
  }
})
