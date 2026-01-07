import { relative } from 'node:path'
import { defineLogger, LogLevel } from '@kubb/core'
import { formatMs } from '@kubb/core/utils'
import { execa } from 'execa'
import { getSummary } from '../utils/getSummary.ts'

/**
 * Plain console adapter for non-TTY environments
 * Simple console.log output with indentation
 */
export const plainLogger = defineLogger({
  name: 'plain',
  install(context, options) {
    const logLevel = options?.logLevel || 3

    function getMessage(message: string): string {
      if (logLevel >= LogLevel.verbose) {
        const timestamp = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        return [`[${timestamp}]`, message].join(' ')
      }

      return message
    }

    context.on('info', (message, info) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(['ℹ', message, info].join(' '))

      console.log(text)
    })

    context.on('success', (message, info = '') => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(['✓', message, logLevel >= LogLevel.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('warn', (message, info) => {
      if (logLevel < LogLevel.warn) {
        return
      }

      const text = getMessage(['⚠', message, logLevel >= LogLevel.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('error', (error) => {
      const caused = error.cause as Error

      const text = getMessage(['✗', error.message].join(' '))

      console.log(text)

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= LogLevel.debug && error.stack) {
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
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration started')

      console.log(text)
    })

    context.on('config:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      console.log(text)
    })

    context.on('generation:start', () => {
      const text = getMessage('Configuration started')

      console.log(text)
    })

    context.on('plugin:start', (plugin) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      const text = getMessage(`Generating ${plugin.name}`)

      console.log(text)
    })

    context.on('plugin:end', (plugin, { duration, success }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const durationStr = formatMs(duration)
      const text = getMessage(success ? `${plugin.name} completed in ${durationStr}` : `${plugin.name} failed in ${durationStr}`)

      console.log(text)
    })

    context.on('files:processing:start', (files) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Writing ${files.length} files`)

      console.log(text)
    })

    context.on('file:processing:update', ({ file, config }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Writing ${relative(config.root, file.path)}`)

      console.log(text)
    })

    context.on('files:processing:end', () => {
      if (logLevel <= LogLevel.silent) {
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

    context.on('hook:start', async ({ id, command, args }) => {
      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      const text = getMessage(`Hook ${commandWithArgs} started`)

      if (logLevel > LogLevel.silent) {
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
        pluginTimings: logLevel >= LogLevel.verbose ? pluginTimings : undefined,
      })

      console.log('---------------------------')
      console.log(summary.join('\n'))
      console.log('---------------------------')
    })
  },
})
