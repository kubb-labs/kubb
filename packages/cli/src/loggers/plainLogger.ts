import { relative } from 'node:path'
import { formatMs, toCause } from '@internals/utils'
import { Diagnostics, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { defineLogger } from './defineLogger.ts'
import { createHookTimer, formatCommandWithArgs, formatMessage } from './utils.ts'

/**
 * Plain console adapter for non-TTY environments with simple `console.log` output.
 */
export const plainLogger = defineLogger({
  name: 'plain',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const hookTimer = createHookTimer()

    function getMessage(message: string): string {
      return formatMessage(message, logLevel)
    }

    // Registers a handler that logs a fixed message, skipped at silent level.
    function onStep<E extends keyof KubbHooks>(event: E, message: string): void {
      context.on(event, () => {
        if (logLevel <= logLevelMap.silent) {
          return
        }
        console.log(getMessage(message))
      })
    }

    context.on('kubb:info', ({ message, info }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(['ℹ', message, info].join(' '))

      console.log(text)
    })

    context.on('kubb:success', ({ message, info = '' }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(['✓', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      const text = getMessage(['⚠', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.on('kubb:error', ({ error }) => {
      const caused = toCause(error)

      const text = getMessage(['✗', error.message].join(' '))

      console.log(text)

      // Show stack trace in verbose mode (first 3 frames)
      if (logLevel >= logLevelMap.verbose && error.stack) {
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

    context.on('kubb:diagnostic', ({ diagnostic }) => {
      // Silent still surfaces errors so failures stay visible. It drops warnings and info.
      if (logLevel <= logLevelMap.silent && diagnostic.severity !== 'error') {
        return
      }
      console.log(getMessage(Diagnostics.formatLines(diagnostic).join('\n')))
    })

    context.on('kubb:lifecycle:start', ({ version }) => {
      console.log(`Kubb CLI v${version}`)
    })

    context.on('kubb:generation:start', () => {
      const text = getMessage('Generation started')

      console.log(text)
    })

    context.on('kubb:plugin:start', ({ plugin }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      const text = getMessage(`Generating ${plugin.name}`)

      console.log(text)
    })

    context.on('kubb:plugin:end', ({ plugin, duration, success }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const durationStr = formatMs(duration)
      const text = getMessage(success ? `${plugin.name} completed in ${durationStr}` : `${plugin.name} failed in ${durationStr}`)

      console.log(text)
    })

    context.on('kubb:files:processing:start', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(`Writing ${files.length} files`)

      console.log(text)
    })

    context.on('kubb:files:processing:update', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      for (const { file, config } of files) {
        console.log(getMessage(`Writing ${relative(config.root, file.path)}`))
      }
    })

    context.on('kubb:files:processing:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Files written successfully')

      console.log(text)
    })

    context.on('kubb:generation:end', ({ config }) => {
      const text = getMessage(config.name ? `Generation completed for ${config.name}` : 'Generation completed')

      console.log(text)
    })

    onStep('kubb:format:start', 'Format started')
    onStep('kubb:format:end', 'Format completed')
    onStep('kubb:lint:start', 'Lint started')
    onStep('kubb:lint:end', 'Lint completed')
    onStep('kubb:hooks:start', 'Hooks started')
    onStep('kubb:hooks:end', 'Hooks completed')

    context.on('kubb:hook:start', ({ id, command, args }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      if (id) {
        hookTimer.start(id)
      }

      const commandWithArgs = formatCommandWithArgs(command, args)
      console.log(getMessage(`Hook ${commandWithArgs} started`))
    })

    context.on('kubb:hook:end', ({ id, command, args, success, error, stdout, stderr }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const ms = id ? hookTimer.end(id) : undefined
      const durationStr = ms !== undefined ? ` in ${formatMs(ms)}` : ''

      const commandWithArgs = formatCommandWithArgs(command, args)

      if (success) {
        console.log(getMessage(`✓ Hook ${commandWithArgs} completed${durationStr}`))
      } else {
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)
        const reason = error?.message ? ` (${error.message})` : ''
        console.log(getMessage(`✗ Hook ${commandWithArgs} failed${durationStr}${reason}`))
      }
    })
  },
})
