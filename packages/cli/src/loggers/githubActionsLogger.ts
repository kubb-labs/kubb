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
    const activeGroups = new Set<string>()

    function openGroup(name: string) {
      if (!activeGroups.has(name)) {
        console.log(`::group::${name}`)
        activeGroups.add(name)
      }
    }

    function closeGroup(name: string) {
      if (activeGroups.has(name)) {
        console.log('::endgroup::')
        activeGroups.delete(name)
      }
    }

    function closeAllGroups() {
      for (const _group of activeGroups) {
        console.log('::endgroup::')
      }
      activeGroups.clear()
    }

    context.on('lifecycle:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      openGroup('Build')
      console.log('start')
    })

    context.on('lifecycle:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      console.log('Build complete')
      closeAllGroups()
    })

    context.on('plugin:start', ({ name }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      openGroup(`Plugin: ${name}`)
    })

    context.on('plugin:end', ({ name }, duration) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      console.log(`✓ ${name} completed in ${duration}ms`)
      closeGroup(`Plugin: ${name}`)
    })

    context.on('info', (message) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      console.log(message)
    })

    context.on('warn', (message) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      console.warn(`::warning::${message}`)
    })

    context.on('error', (error) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const message = error instanceof Error ? error.message : String(error)
      console.error(`::error::${message}`)
    })

    context.on('debug', (_message) => {
      if (logLevel < LogLevel.debug) {
        return
      }
      // const category = message.category ? `[${message.category}]` : ''
      // const logs = message.logs.join('\n')
      // console.debug(`::debug::${category} ${logs}`)
    })

    context.on('hook:execute', async ({ command, args }, cb) => {
      try {
        await execa(command, args, {
          detached: true,
          stdout: logLevel === LogLevel.silent ? undefined : ['pipe'],
          stripFinalNewline: true,
        })
        cb()
      } catch (error) {
        context.emit('error', error as Error)
      }
    })

    context.on('files:processing:start', (totalFiles) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      openGroup('File Generation')
      console.log(`Generating ${totalFiles} files...`)
    })

    context.on('files:processing:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      console.log('✓ Files generated')
      closeGroup('File Generation')
    })

    context.on('lifecycle:end', async () => {
      closeAllGroups()
    })
  },
})
