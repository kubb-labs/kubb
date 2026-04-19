import { styleText } from 'node:util'
import { formatHrtime, formatMs, formatMsWithColor, toCause } from '@internals/utils'
import { type Config, defineLogger, logLevel as logLevelMap } from '@kubb/core'
import { runHook } from '../utils/runHook.ts'
import { buildProgressLine, formatCommandWithArgs, formatMessage } from './utils.ts'

/**
 * GitHub Actions adapter for CI environments
 * Uses Github group annotations for collapsible sections
 */
export const githubActionsLogger = defineLogger({
  name: 'github-actions',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
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
      state.currentConfigs = []
    }

    function showProgressStep() {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const line = buildProgressLine(state)
      if (line) {
        console.log(getMessage(line))
      }
    }

    function getMessage(message: string): string {
      return formatMessage(message, logLevel)
    }

    function openGroup(name: string) {
      console.log(`::group::${name}`)
    }

    function closeGroup(_name: string) {
      console.log('::endgroup::')
    }

    context.on('kubb:info', (message, info = '') => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage([styleText('blue', 'ℹ'), message, styleText('dim', info)].join(' '))

      console.log(text)
    })

    context.on('kubb:success', (message, info = '') => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage([styleText('blue', '✓'), message, logLevel >= logLevelMap.info ? styleText('dim', info) : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('kubb:warn', (message, info = '') => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage([styleText('yellow', '⚠'), message, logLevel >= logLevelMap.info ? styleText('dim', info) : undefined].filter(Boolean).join(' '))

      console.warn(`::warning::${text}`)
    })

    context.on('kubb:error', (error) => {
      const caused = toCause(error)

      if (logLevel <= logLevelMap.silent) {
        return
      }
      const message = error.message || String(error)
      console.error(`::error::${message}`)

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= logLevelMap.debug && error.stack) {
        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          console.log(getMessage(styleText('dim', frame.trim())))
        }

        if (caused?.stack) {
          console.log(styleText('dim', `└─ caused by ${caused.message}`))

          const frames = caused.stack.split('\n').slice(1, 4)
          for (const frame of frames) {
            console.log(getMessage(`    ${styleText('dim', frame.trim())}`))
          }
        }
      }
    })

    context.on('kubb:lifecycle:start', (version) => {
      console.log(styleText('yellow', `Kubb ${version} 🧩`))
      reset()
    })

    context.on('kubb:config:start', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Configuration started')

      openGroup('Configuration')

      console.log(text)
    })

    context.on('kubb:config:end', (configs) => {
      state.currentConfigs = configs

      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      console.log(text)

      closeGroup('Configuration')
    })

    context.on('kubb:generation:start', (config) => {
      reset()

      // Initialize progress tracking for this generation
      state.totalPlugins = config.plugins?.length ?? 0

      const text = config.name ? `Generation for ${styleText('bold', config.name)}` : 'Generation'

      if (state.currentConfigs.length > 1) {
        openGroup(text)
      }

      if (state.currentConfigs.length === 1) {
        console.log(getMessage(text))
      }
    })

    context.on('kubb:plugin:start', (plugin) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      const text = getMessage(`Generating ${styleText('bold', plugin.name)}`)

      if (state.currentConfigs.length === 1) {
        openGroup(`Plugin: ${plugin.name}`)
      }

      console.log(text)
    })

    context.on('kubb:plugin:end', (plugin, { duration, success }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      if (success) {
        state.completedPlugins++
      } else {
        state.failedPlugins++
      }

      const durationStr = formatMsWithColor(duration)
      const text = getMessage(
        success
          ? `${styleText('bold', plugin.name)} completed in ${durationStr}`
          : `${styleText('bold', plugin.name)} failed in ${styleText('red', formatMs(duration))}`,
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

    context.on('kubb:files:processing:start', (files) => {
      if (logLevel <= logLevelMap.silent) {
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

    context.on('kubb:files:processing:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      const text = getMessage('Files written successfully')

      console.log(text)

      if (state.currentConfigs.length === 1) {
        closeGroup('File Generation')
      }

      // Show final progress step after files are written
      showProgressStep()
    })

    context.on('kubb:file:processing:update', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      state.processedFiles++
    })

    context.on('kubb:generation:end', (config) => {
      const text = getMessage(
        config.name ? `${styleText('blue', '✓')} Generation completed for ${styleText('dim', config.name)}` : `${styleText('blue', '✓')} Generation completed`,
      )

      console.log(text)
    })

    context.on('kubb:format:start', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Format started')

      if (state.currentConfigs.length === 1) {
        openGroup('Formatting')
      }

      console.log(text)
    })

    context.on('kubb:format:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Format completed')

      console.log(text)

      if (state.currentConfigs.length === 1) {
        closeGroup('Formatting')
      }
    })

    context.on('kubb:lint:start', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Lint started')

      if (state.currentConfigs.length === 1) {
        openGroup('Linting')
      }

      console.log(text)
    })

    context.on('kubb:lint:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Lint completed')

      console.log(text)

      if (state.currentConfigs.length === 1) {
        closeGroup('Linting')
      }
    })

    context.on('kubb:hook:start', async ({ id, command, args }) => {
      const commandWithArgs = formatCommandWithArgs(command, args)
      const text = getMessage(`Hook ${styleText('dim', commandWithArgs)} started`)

      if (logLevel > logLevelMap.silent) {
        if (state.currentConfigs.length === 1) {
          openGroup(`Hook ${commandWithArgs}`)
        }
        console.log(text)
      }

      // Skip hook execution if no id is provided (e.g., during benchmarks or tests)
      if (!id) {
        return
      }

      await runHook({
        id,
        command,
        args,
        commandWithArgs,
        context,
        sink: {
          // GHA formats errors with the ::error:: annotation
          onStdout: logLevel > logLevelMap.silent ? (s) => console.log(s) : undefined,
          onStderr: logLevel > logLevelMap.silent ? (s) => console.error(`::error::${s}`) : undefined,
        },
      })
    })

    context.on('kubb:hook:end', ({ command, args }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const commandWithArgs = formatCommandWithArgs(command, args)
      const text = getMessage(`Hook ${styleText('dim', commandWithArgs)} completed`)

      console.log(text)

      if (state.currentConfigs.length === 1) {
        closeGroup(`Hook ${commandWithArgs}`)
      }
    })

    context.on('kubb:generation:summary', (config, { status, hrStart, failedPlugins }) => {
      const pluginsCount = config.plugins?.length ?? 0
      const successCount = pluginsCount - failedPlugins.size
      const duration = formatHrtime(hrStart)

      if (state.currentConfigs.length > 1) {
        console.log(' ')
      }

      console.log(
        status === 'success'
          ? `Kubb Summary: ${styleText('blue', '✓')} ${`${successCount} successful`}, ${pluginsCount} total, ${styleText('green', duration)}`
          : `Kubb Summary: ${styleText('blue', '✓')} ${`${successCount} successful`}, ✗ ${`${failedPlugins.size} failed`}, ${pluginsCount} total, ${styleText('green', duration)}`,
      )

      if (state.currentConfigs.length > 1) {
        closeGroup(config.name ? `Generation for ${styleText('bold', config.name)}` : 'Generation')
      }
    })

    context.on('kubb:lifecycle:end', () => {
      reset()
    })
  },
})
