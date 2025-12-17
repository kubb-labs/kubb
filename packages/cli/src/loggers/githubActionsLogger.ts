import { type Config, defineLogger, LogLevel } from '@kubb/core'
import { execa } from 'execa'
import pc from 'picocolors'

/**
 * GitHub Actions adapter for CI environments
 * Uses ::group:: and ::endgroup:: annotations for collapsible sections
 */
export const githubActionsLogger = defineLogger({
  name: 'github-actions',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const activeGroups = new Set<string>()
    let currentConfigs: Array<Config> = []

    function getMessage(message: string): string {
      if (logLevel >= LogLevel.verbose) {
        const timestamp = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        return [pc.dim(`[${timestamp}]`), message].join(' ')
      }

      return message
    }

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

    context.on('info', (message, info) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage([pc.blue('ℹ'), message, pc.dim(info)].join(' '))

      console.log(text)
    })

    context.on('success', (message, info = '') => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage([pc.blue('✓'), message, logLevel >= LogLevel.info ? pc.dim(info) : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('warn', (message, info) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage([pc.yellow('⚠'), message, logLevel >= LogLevel.info ? pc.dim(info) : undefined].filter(Boolean).join(' '))

      console.warn(`::warning::${text}`)
    })

    context.on('error', (error) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const message = error.message || String(error)
      console.error(`::error::${message}`)
    })

    context.on('lifecycle:start', (version) => {
      console.log(pc.yellow(`Kubb ${version} 🧩`))
    })

    context.on('config:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration started')

      console.log(text)
    })

    context.on('config:end', (configs) => {
      currentConfigs = configs

      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      console.log(text)
    })

    context.on('generation:start', (name) => {
      const text = getMessage(['Generation started', name ? `for ${pc.dim(name)}` : undefined].filter(Boolean).join(' '))

      if (currentConfigs.length > 0) {
        openGroup(`Generation: ${name || ''}`)
      }
      console.log(text)
    })

    context.on('plugin:start', (plugin) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const text = getMessage(`Generating ${pc.bold(plugin.name)}`)

      if (currentConfigs.length === 0) {
        openGroup(`Plugin: ${plugin.name}`)
      }

      console.log(text)
    })

    context.on('plugin:end', (plugin, duration) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`
      const text = getMessage(`${pc.bold(plugin.name)} completed in ${pc.green(durationStr)}`)

      console.log(text)

      if (currentConfigs.length === 0) {
        closeGroup(`Plugin: ${plugin.name}`)
      }
    })

    context.on('files:processing:start', (files) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      if (currentConfigs.length === 0) {
        openGroup('File Generation')
      }
      const text = getMessage(`Writing ${files.length} files`)

      console.log(text)
    })

    context.on('files:processing:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const text = getMessage('Files written successfully')

      console.log(text)

      if (currentConfigs.length === 0) {
        closeGroup('File Generation')
      }
    })

    context.on('generation:end', (name) => {
      const text = getMessage(name ? `${pc.blue('✓')} Generation completed for ${pc.dim(name)}` : `${pc.blue('✓')} Generation completed`)

      console.log(text)

      if (currentConfigs.length > 0) {
        closeGroup(`Generation: ${name || ''}`)
      }
    })

    context.on('generation:summary', ({ config, status, failedPlugins }) => {
      const pluginsCount = config.plugins?.length || 0
      const successCount = pluginsCount - failedPlugins.size

      console.log(
        status === 'success'
          ? `Kubb Summary: ${pc.blue('✓')} ${`${successCount} successful`}, ${pluginsCount} total`
          : `Kubb Summary: ${pc.blue('✓')} ${`${successCount} successful`}, ✗ ${`${failedPlugins.size} failed`}, ${pluginsCount} total`,
      )
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
        await context.emit('error', error as Error)
      }
    })

    context.on('format:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Format started')

      console.log(text)
    })

    context.on('format:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Format completed')

      console.log(text)
    })

    context.on('lint:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Lint started')

      console.log(text)
    })

    context.on('lint:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Lint completed')

      console.log(text)
    })

    context.on('hook:start', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Hook ${pc.dim(command)} started`)

      console.log(text)
    })

    context.on('hook:end', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Hook ${pc.dim(command)} completed`)

      console.log(text)
    })

    context.on('lifecycle:end', async () => {
      closeAllGroups()
    })
  },
})
