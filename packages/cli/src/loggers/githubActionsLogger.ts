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
      console.log(`::group::${name}`)
    }

    function closeGroup(_name: string) {
      console.log('::endgroup::')
    }

    context.on('info', (message, info = '') => {
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

    context.on('warn', (message, info = '') => {
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

      openGroup('Configuration')

      console.log(text)
    })

    context.on('config:end', (configs) => {
      currentConfigs = configs

      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      console.log(text)

      closeGroup('Configuration')
    })

    context.on('generation:start', (config) => {
      const text = config.name ? `Generation for ${pc.bold(config.name)}` : 'Generation'

      if (currentConfigs.length > 1) {
        openGroup(text)
      }

      if (currentConfigs.length === 1) {
        console.log(getMessage(text))
      }
    })

    context.on('plugin:start', (plugin) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const text = getMessage(`Generating ${pc.bold(plugin.name)}`)

      if (currentConfigs.length === 1) {
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
      if (currentConfigs.length > 1) {
        console.log(' ')
      }

      if (currentConfigs.length === 1) {
        closeGroup(`Plugin: ${plugin.name}`)
      }
    })

    context.on('files:processing:start', (files) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      if (currentConfigs.length === 1) {
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

      if (currentConfigs.length === 1) {
        closeGroup('File Generation')
      }
    })

    context.on('generation:end', (config) => {
      const text = getMessage(config.name ? `${pc.blue('✓')} Generation completed for ${pc.dim(config.name)}` : `${pc.blue('✓')} Generation completed`)

      console.log(text)
    })

    context.on('hook:execute', async ({ command, args }, cb) => {
      try {
        const result = await execa(command, args, {
          detached: true,
          stripFinalNewline: true,
        })

        await context.emit('debug', {
          date: new Date(),
          logs: [result.stdout],
        })

        console.log(result.stdout)

        cb()
      } catch (err) {
        const error = new Error('Hook execute failed')
        error.cause = err

        await context.emit('debug', {
          date: new Date(),
          logs: [(err as any).stdout],
        })

        await context.emit('error', error)
      }
    })

    context.on('format:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Format started')

      if (currentConfigs.length === 1) {
        openGroup('Formatting')
      }

      console.log(text)
    })

    context.on('format:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Format completed')

      console.log(text)

      if (currentConfigs.length === 1) {
        closeGroup('Formatting')
      }
    })

    context.on('lint:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Lint started')

      if (currentConfigs.length === 1) {
        openGroup('Linting')
      }

      console.log(text)
    })

    context.on('lint:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Lint completed')

      console.log(text)

      if (currentConfigs.length === 1) {
        closeGroup('Linting')
      }
    })

    context.on('hook:start', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Hook ${pc.dim(command)} started`)

      if (currentConfigs.length === 1) {
        openGroup(`Hook ${command}`)
      }

      console.log(text)
    })

    context.on('hook:end', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Hook ${pc.dim(command)} completed`)

      console.log(text)

      if (currentConfigs.length === 1) {
        closeGroup(`Hook ${command}`)
      }
    })

    context.on('generation:summary', (config, { status, failedPlugins }) => {
      const pluginsCount = config.plugins?.length || 0
      const successCount = pluginsCount - failedPlugins.size

      if (currentConfigs.length > 1) {
        console.log(' ')
      }

      console.log(
        status === 'success'
          ? `Kubb Summary: ${pc.blue('✓')} ${`${successCount} successful`}, ${pluginsCount} total`
          : `Kubb Summary: ${pc.blue('✓')} ${`${successCount} successful`}, ✗ ${`${failedPlugins.size} failed`}, ${pluginsCount} total`,
      )

      if (currentConfigs.length > 1) {
        closeGroup(config.name ? `Generation for ${pc.bold(config.name)}` : 'Generation')
      }
    })
  },
})
