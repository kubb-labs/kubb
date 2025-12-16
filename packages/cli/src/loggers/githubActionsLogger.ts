import { defineLogger, LogLevel } from '@kubb/core'
import { execa } from 'execa'

/**
 * GitHub Actions adapter for CI environments
 * Uses ::group:: and ::endgroup:: annotations for collapsible sections
 */
export const githubActionsLogger = defineLogger({
  name: 'github-actions',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const activeGroups: Map<string, boolean> = new Map()

    context.on('lifecycle:start', () => {
      console.log('Kubb started')
    })

    context.on('lifecycle:end', () => {
      console.log('Kubb completed')
    })

    context.on('success', (message) => {
      console.log(`✓ ${message}`)
    })

    context.on('warn', (message) => {
      if (logLevel >= LogLevel.warn) {
        console.log(`::warning::${message}`)
      }
    })

    context.on('error', (error) => {
      console.log(`::error::${error.message}`)
    })

    context.on('info', (message) => {
      if (logLevel >= LogLevel.info) {
        console.log(message)
      }
    })

    // Plugin lifecycle creates nested groups
    context.on('plugin:start', (plugin) => {
      const groupId = `plugin:${plugin.name}`
      console.log(`::group::${plugin.name}`)
      activeGroups.set(groupId, true)
    })

    context.on('plugin:end', (plugin, duration) => {
      const groupId = `plugin:${plugin.name}`
      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`
      console.log(`${plugin.name} completed in ${durationStr}`)
      if (activeGroups.get(groupId)) {
        console.log('::endgroup::')
        activeGroups.delete(groupId)
      }
    })

    context.on('hook:execute', async ({ command, args }, cb) => {
      await execa(command, args, {
        detached: true,
        stdout: logLevel === LogLevel.silent ? undefined : ['pipe'],
        stripFinalNewline: true,
      })

      cb()
    })

    context.on('files:processing:start', (count) => {
      console.log(`Processing ${count} files...`)
    })

    context.on('file:processing:update', ({ processed, total }) => {
      console.log(`Progress: ${processed}/${total} files`)
    })

    context.on('files:processing:end', (count) => {
      console.log(`Completed ${count} files`)
    })

    context.on('lifecycle:end', () => {
      for (const [_groupId, isActive] of activeGroups) {
        if (isActive) {
          console.log('::endgroup::')
        }
      }
      activeGroups.clear()
    })
  },
})
