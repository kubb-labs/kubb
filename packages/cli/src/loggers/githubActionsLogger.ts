import { type Config, defineLogger, LogLevel } from '@kubb/core'
import { formatHrtime, formatMs } from '@kubb/core/utils'
import { execa } from 'execa'
import pc from 'picocolors'
import { formatMsWithColor } from '../utils/formatMsWithColor.ts'

/**
 * GitHub Actions adapter for CI environments
 * Uses Github group annotations for collapsible sections
 */
export const githubActionsLogger = defineLogger({
  name: 'github-actions',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const state = {
      totalPlugins: 0,
      completedPlugins: 0,
      failedPlugins: 0,
      totalFiles: 0,
      processedFiles: 0,
      hrStart: process.hrtime(),
      currentConfigs: [] as Array<Config>,
    }

    function reset() {
      state.totalPlugins = 0
      state.completedPlugins = 0
      state.failedPlugins = 0
      state.totalFiles = 0
      state.processedFiles = 0
      state.hrStart = process.hrtime()
    }

    function showProgressStep() {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const parts: string[] = []
      const duration = formatHrtime(state.hrStart)

      if (state.totalPlugins > 0) {
        const pluginStr =
          state.failedPlugins > 0
            ? `Plugins ${pc.green(state.completedPlugins.toString())}/${state.totalPlugins} ${pc.red(`(${state.failedPlugins} failed)`)}`
            : `Plugins ${pc.green(state.completedPlugins.toString())}/${state.totalPlugins}`
        parts.push(pluginStr)
      }

      if (state.totalFiles > 0) {
        parts.push(`Files ${pc.green(state.processedFiles.toString())}/${state.totalFiles}`)
      }

      if (parts.length > 0) {
        parts.push(`${pc.green(duration)} elapsed`)
        console.log(getMessage(parts.join(pc.dim(' | '))))
      }
    }

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
      const caused = error.cause as Error

      if (logLevel <= LogLevel.silent) {
        return
      }
      const message = error.message || String(error)
      console.error(`::error::${message}`)

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= LogLevel.debug && error.stack) {
        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          console.log(getMessage(pc.dim(frame.trim())))
        }

        if (caused?.stack) {
          console.log(pc.dim(`└─ caused by ${caused.message}`))

          const frames = caused.stack.split('\n').slice(1, 4)
          for (const frame of frames) {
            console.log(getMessage(`    ${pc.dim(frame.trim())}`))
          }
        }
      }
    })

    context.on('lifecycle:start', (version) => {
      console.log(pc.yellow(`Kubb ${version} 🧩`))
      reset()
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
      state.currentConfigs = configs

      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      console.log(text)

      closeGroup('Configuration')
    })

    context.on('generation:start', (config) => {
      // Initialize progress tracking
      state.totalPlugins = config.plugins?.length || 0

      const text = config.name ? `Generation for ${pc.bold(config.name)}` : 'Generation'

      if (state.currentConfigs.length > 1) {
        openGroup(text)
      }

      if (state.currentConfigs.length === 1) {
        console.log(getMessage(text))
      }

      reset()
    })

    context.on('plugin:start', (plugin) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const text = getMessage(`Generating ${pc.bold(plugin.name)}`)

      if (state.currentConfigs.length === 1) {
        openGroup(`Plugin: ${plugin.name}`)
      }

      console.log(text)
    })

    context.on('plugin:end', (plugin, { duration, success }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      if (success) {
        state.completedPlugins++
      } else {
        state.failedPlugins++
      }

      const durationStr = formatMsWithColor(duration)
      const text = getMessage(
        success ? `${pc.bold(plugin.name)} completed in ${durationStr}` : `${pc.bold(plugin.name)} failed in ${pc.red(formatMs(duration))}`,
      )

      console.log(text)
      if (state.currentConfigs.length > 1) {
        console.log(' ')
      }

      if (state.currentConfigs.length === 1) {
        closeGroup(`Plugin: ${plugin.name}`)
      }

      // Show progress step after each plugin
      showProgressStep()
    })

    context.on('files:processing:start', (files) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      state.totalFiles = files.length
      state.processedFiles = 0

      if (state.currentConfigs.length === 1) {
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

      if (state.currentConfigs.length === 1) {
        closeGroup('File Generation')
      }
    })

    context.on('file:processing:update', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      state.processedFiles++
    })

    context.on('files:processing:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      // Show final progress step after files are written
      showProgressStep()
    })

    context.on('generation:end', (config) => {
      const text = getMessage(config.name ? `${pc.blue('✓')} Generation completed for ${pc.dim(config.name)}` : `${pc.blue('✓')} Generation completed`)

      console.log(text)
    })

    context.on('format:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Format started')

      if (state.currentConfigs.length === 1) {
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

      if (state.currentConfigs.length === 1) {
        closeGroup('Formatting')
      }
    })

    context.on('lint:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Lint started')

      if (state.currentConfigs.length === 1) {
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

      if (state.currentConfigs.length === 1) {
        closeGroup('Linting')
      }
    })

    context.on('hook:start', async ({ id, command, args }) => {
      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      const text = getMessage(`Hook ${pc.dim(commandWithArgs)} started`)

      if (logLevel > LogLevel.silent) {
        if (state.currentConfigs.length === 1) {
          openGroup(`Hook ${commandWithArgs}`)
        }

        console.log(text)
      }

      // Skip hook execution if no id is provided (e.g., during benchmarks or tests)
      if (!id) {
        return
      }

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

        await context.emit('hook:end', {
          command,
          args,
          id,
          success: true,
          error: null,
        })
      } catch (err) {
        const error = new Error('Hook execute failed')
        error.cause = err

        await context.emit('debug', {
          date: new Date(),
          logs: [(err as any).stdout],
        })

        await context.emit('hook:end', {
          command,
          args,
          id,
          success: false,
          error,
        })
        await context.emit('error', error)
      }
    })

    context.on('hook:end', ({ command, args }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      const text = getMessage(`Hook ${pc.dim(commandWithArgs)} completed`)

      console.log(text)

      if (state.currentConfigs.length === 1) {
        closeGroup(`Hook ${commandWithArgs}`)
      }
    })

    context.on('generation:summary', (config, { status, hrStart, failedPlugins }) => {
      const pluginsCount = config.plugins?.length || 0
      const successCount = pluginsCount - failedPlugins.size
      const duration = formatHrtime(hrStart)

      if (state.currentConfigs.length > 1) {
        console.log(' ')
      }

      console.log(
        status === 'success'
          ? `Kubb Summary: ${pc.blue('✓')} ${`${successCount} successful`}, ${pluginsCount} total, ${pc.green(duration)}`
          : `Kubb Summary: ${pc.blue('✓')} ${`${successCount} successful`}, ✗ ${`${failedPlugins.size} failed`}, ${pluginsCount} total, ${pc.green(duration)}`,
      )

      if (state.currentConfigs.length > 1) {
        closeGroup(config.name ? `Generation for ${pc.bold(config.name)}` : 'Generation')
      }
    })
  },
})
