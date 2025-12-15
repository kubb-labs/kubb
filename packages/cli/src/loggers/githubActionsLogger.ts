import { defineLogger, LogLevel } from '@kubb/core'

/**
 * GitHub Actions adapter for CI environments
 * Uses ::group:: and ::endgroup:: annotations for collapsible sections
 * Supports nested groups with group IDs
 */
export const githubActionsLogger = defineLogger({
  name: 'github-actions',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const activeGroups: Map<string, boolean> = new Map()

    context.on('lifecycle:start', (message, opts) => {
      const groupId = opts?.groupId || 'main'
      console.log(`::group::${message}`)
      activeGroups.set(groupId, true)
    })

    context.on('lifecycle:end', (message, opts) => {
      const groupId = opts?.groupId || 'main'
      if (activeGroups.get(groupId)) {
        console.log('::endgroup::')
        activeGroups.delete(groupId)
      }
      console.log(message)
    })

    context.on('success', (message, opts) => {
      if (opts?.groupId) {
        if (!activeGroups.get(opts.groupId)) {
          console.log(`::group::${opts.groupId}`)
          activeGroups.set(opts.groupId, true)
        }
      }
      console.log(`✓ ${message}`)
    })

    context.on('warn', (message, opts) => {
      if (logLevel >= LogLevel.warn) {
        if (opts?.groupId) {
          if (!activeGroups.get(opts.groupId)) {
            console.log(`::group::${opts.groupId}`)
            activeGroups.set(opts.groupId, true)
          }
        }
        console.log(`::warning::${message}`)
      }
    })

    context.on('error', (error, opts) => {
      if (opts?.groupId) {
        if (!activeGroups.get(opts.groupId)) {
          console.log(`::group::${opts.groupId}`)
          activeGroups.set(opts.groupId, true)
        }
      }
      console.log(`::error::${error.message}`)
    })

    context.on('info', (message, opts) => {
      if (logLevel >= LogLevel.info) {
        if (opts?.groupId) {
          if (!activeGroups.get(opts.groupId)) {
            console.log(`::group::${opts.groupId}`)
            activeGroups.set(opts.groupId, true)
          }
        }
        console.log(message)
      }
    })

    context.on('verbose', (message, opts) => {
      if (logLevel >= LogLevel.verbose) {
        if (opts?.groupId) {
          if (!activeGroups.get(opts.groupId)) {
            console.log(`::group::${opts.groupId}`)
            activeGroups.set(opts.groupId, true)
          }
        }
        const formattedLogs = message.logs.join('\n')
        console.log(formattedLogs)

        // Auto-close group if pluginGroupMarker is 'end'
        if (opts?.pluginGroupMarker === 'end' && opts?.groupId) {
          if (activeGroups.get(opts.groupId)) {
            console.log('::endgroup::')
            activeGroups.delete(opts.groupId)
          }
        }
      }
    })

    context.on('debug', (message, opts) => {
      if (logLevel >= LogLevel.debug) {
        if (opts?.groupId) {
          if (!activeGroups.get(opts.groupId)) {
            console.log(`::group::${opts.groupId}`)
            activeGroups.set(opts.groupId, true)
          }
        }
        const category = message.category || 'debug'
        const formattedLogs = message.logs.map((log) => `[${category}] ${log}`).join('\n')
        console.log(formattedLogs)

        // Auto-close group if pluginGroupMarker is 'end'
        if (opts?.pluginGroupMarker === 'end' && opts?.groupId) {
          if (activeGroups.get(opts.groupId)) {
            console.log('::endgroup::')
            activeGroups.delete(opts.groupId)
          }
        }
      }
    })

    // Plugin lifecycle creates nested groups
    context.on('plugin:start', (plugin, opts) => {
      const groupId = opts?.groupId || `plugin:${plugin.name}`
      console.log(`::group::${plugin.name}`)
      activeGroups.set(groupId, true)
    })

    context.on('plugin:end', (plugin, duration, opts) => {
      const groupId = opts?.groupId || `plugin:${plugin.name}`
      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`
      console.log(`${plugin.name} completed in ${durationStr}`)
      if (activeGroups.get(groupId)) {
        console.log('::endgroup::')
        activeGroups.delete(groupId)
      }
    })

    // File processing logs
    context.on('files:processing:start', (count) => {
      console.log(`Processing ${count} files...`)
    })

    context.on('files:processing:update', (current, total) => {
      console.log(`Progress: ${current}/${total} files`)
    })

    context.on('files:processing:end', (count) => {
      console.log(`Completed ${count} files`)
    })

    // Cleanup: close all open groups
    return () => {
      for (const [_groupId, isActive] of activeGroups) {
        if (isActive) {
          console.log('::endgroup::')
        }
      }
      activeGroups.clear()
    }
  },
})
