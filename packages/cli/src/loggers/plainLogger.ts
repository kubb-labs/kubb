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
      const text = ['ℹ', message, info].join(' ')

      if (logLevel >= LogLevel.info) {
        console.log(getMessage(text))
      }
    })

    context.on('success', (message, info = '') => {
      const text = ['✓', message, logLevel >= LogLevel.info ? info : undefined].filter(Boolean).join(' ')

      console.log(getMessage(text))
    })

    context.on('warn', (message, info) => {
      const text = ['⚠', message, logLevel >= LogLevel.info ? info : undefined].filter(Boolean).join(' ')

      if (logLevel >= LogLevel.warn) {
        console.log(getMessage(text))
      }
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
      console.log(getMessage('Configuration started'))
    })

    context.on('config:end', () => {
      console.log(getMessage('Configuration completed'))
    })

    context.on('generation:start', () => {
      console.log(getMessage('Configuration started'))
    })

    context.on('generation:end', ({ summary, title }) => {
      console.log(getMessage('Generation completed'))

      console.log(title)
      console.log(summary.join(''))
    })

    context.on('hook:execute', async ({ command, args }, cb) => {
      await execa(command, args, {
        detached: true,
        stdout: logLevel === LogLevel.silent ? undefined : ['pipe'],
        stripFinalNewline: true,
      })

      cb()
    })

    context.on('format:start', () => {
      console.log(getMessage('Format started'))
    })

    context.on('format:end', () => {
      console.log(getMessage('Format completed'))
    })

    context.on('lint:start', () => {
      console.log(getMessage('Lint started'))
    })

    context.on('lint:end', () => {
      console.log(getMessage('Lint completed'))
    })

    context.on('hook:start', (command) => {
      console.log(getMessage(`Hook ${command} started`))
    })

    context.on('hook:end', (command) => {
      console.log(getMessage(`Hook ${command} completed`))
    })

    //
    // context.on('plugin:start', (plugin) => {
    //   log(`Starting ${plugin.name}...`)
    //   indentLevel++
    // })
    //
    // context.on('plugin:end', (plugin, duration) => {
    //   indentLevel = Math.max(0, indentLevel - 1)
    //   log(`${plugin.name} completed in ${duration}ms`)
    // })
  },
})
