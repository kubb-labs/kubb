import { relative } from 'node:path'
import { defineLogger, LogLevel } from '@kubb/core'
import { execa } from 'execa'

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

      const text = ['ℹ', message, info].join(' ')

      console.log(getMessage(text))
    })

    context.on('success', (message, info = '') => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = ['✓', message, logLevel >= LogLevel.info ? info : undefined].filter(Boolean).join(' ')

      console.log(getMessage(text))
    })

    context.on('warn', (message, info) => {
      if (logLevel < LogLevel.warn) {
        return
      }

      const text = ['⚠', message, logLevel >= LogLevel.info ? info : undefined].filter(Boolean).join(' ')

      console.log(getMessage(text))
    })

    context.on('error', (error) => {
      const caused = error.cause as Error

      const text = ['✗', error.message].join(' ')

      console.log(getMessage(text))

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

      console.log(getMessage('Configuration started'))
    })

    context.on('config:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      console.log(getMessage('Configuration completed'))
    })

    context.on('generation:start', () => {
      console.log(getMessage('Configuration started'))
    })

    context.on('plugin:start', (plugin) => {
      if (logLevel <= LogLevel.silent) {
        return
      }
      console.log(getMessage(`Generating ${plugin.name}`))
    })

    context.on('plugin:end', (plugin, duration) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

      console.log(getMessage(`${plugin.name} completed in ${durationStr}`))
    })

    context.on('files:processing:start', ({ files }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = `Writing ${files.length} files`

      console.log(getMessage(text))
    })

    context.on('file:processing:update', ({ file, config }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = `Writing ${relative(config.root, file.path)}`

      console.log(getMessage(text))
    })

    context.on('files:processing:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = 'Files written successfully'

      console.log(getMessage(text))
    })

    context.on('generation:end', (name) => {
      console.log(getMessage(name ? `Generation completed for ${name}` : 'Generation completed'))
    })

    context.on('generation:summary', ({ summary }) => {
      console.log('---------------------------')
      console.log(summary.join('\n'))
      console.log('---------------------------')
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
        context.emit('error', error)
      }
    })

    context.on('format:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      console.log(getMessage('Format started'))
    })

    context.on('format:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      console.log(getMessage('Format completed'))
    })

    context.on('lint:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      console.log(getMessage('Lint started'))
    })

    context.on('lint:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      console.log(getMessage('Lint completed'))
    })

    context.on('hook:start', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      console.log(getMessage(`Hook ${command} started`))
    })

    context.on('hook:end', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      console.log(getMessage(`Hook ${command} completed`))
    })
  },
})
