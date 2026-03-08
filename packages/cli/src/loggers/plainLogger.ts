import { relative } from 'node:path'
import { defineLogger, logLevel as logLevelMap } from '@kubb/core'
import { formatMs } from '@kubb/core/utils'
import { SUMMARY_SEPARATOR } from '../constants.ts'
import { toCause } from '../utils/errors.ts'
import { getSummary } from '../utils/getSummary.ts'
import { runHook } from '../utils/runHook.ts'
import { formatCommandWithArgs, formatMessage } from './utils.ts'

/**
 * Plain console adapter for non-TTY environments
 * Simple console.log output with indentation
 */
export const plainLogger = defineLogger({
  name: 'plain',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info

    function getMessage(message: string): string {
      return formatMessage(message, logLevel)
    }

    context.on('info', (message, info) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(['ℹ', message, info].join(' '))

      console.log(text)
    })

    context.on('success', (message, info = '') => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(['✓', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('warn', (message, info) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      const text = getMessage(['⚠', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('error', (error) => {
      const caused = toCause(error)

      const text = getMessage(['✗', error.message].join(' '))

      console.log(text)

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= logLevelMap.debug && error.stack) {
        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          console.log(getMessage(frame.trim()))
        }

        if (caused?.stack) {
          console.log(`└─ caused by ${caused.message}`)

          const frames = caused.stack.split('\n').slice(1, 4)
          for (const frame of frames) {
            console.log(getMessage(`    ${frame.trim()}`))
          }
        }
      }
    })

    context.on('lifecycle:start', () => {
      console.log('Kubb CLI 🧩')
    })

    context.on('config:start', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Configuration started')

      console.log(text)
    })

    context.on('config:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      console.log(text)
    })

    context.on('generation:start', () => {
      const text = getMessage('Generation started')

      console.log(text)
    })

    context.on('plugin:start', (plugin) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      const text = getMessage(`Generating ${plugin.name}`)

      console.log(text)
    })

    context.on('plugin:end', (plugin, { duration, success }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const durationStr = formatMs(duration)
      const text = getMessage(success ? `${plugin.name} completed in ${durationStr}` : `${plugin.name} failed in ${durationStr}`)

      console.log(text)
    })

    context.on('files:processing:start', (files) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(`Writing ${files.length} files`)

      console.log(text)
    })

    context.on('file:processing:update', ({ file, config }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(`Writing ${relative(config.root, file.path)}`)

      console.log(text)
    })

    context.on('files:processing:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Files written successfully')

      console.log(text)
    })

    context.on('generation:end', (config) => {
      const text = getMessage(config.name ? `Generation completed for ${config.name}` : 'Generation completed')

      console.log(text)
    })

    context.on('format:start', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Format started')

      console.log(text)
    })

    context.on('format:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Format completed')

      console.log(text)
    })

    context.on('lint:start', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Lint started')

      console.log(text)
    })

    context.on('lint:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Lint completed')

      console.log(text)
    })

    context.on('hook:start', async ({ id, command, args }) => {
      const commandWithArgs = formatCommandWithArgs(command, args)
      const text = getMessage(`Hook ${commandWithArgs} started`)

      if (logLevel > logLevelMap.silent) {
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
          onStdout: logLevel > logLevelMap.silent ? (s) => console.log(s) : undefined,
          onStderr: logLevel > logLevelMap.silent ? (s) => console.error(s) : undefined,
        },
      })
    })

    context.on('hook:end', ({ command, args }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const commandWithArgs = formatCommandWithArgs(command, args)
      const text = getMessage(`Hook ${commandWithArgs} completed`)

      console.log(text)
    })

    context.on('generation:summary', (config, { pluginTimings, status, hrStart, failedPlugins, filesCreated }) => {
      const summary = getSummary({
        failedPlugins,
        filesCreated,
        config,
        status,
        hrStart,
        pluginTimings: logLevel >= logLevelMap.verbose ? pluginTimings : undefined,
      })

      console.log(SUMMARY_SEPARATOR)
      console.log(summary.join('\n'))
      console.log(SUMMARY_SEPARATOR)
    })
  },
})
