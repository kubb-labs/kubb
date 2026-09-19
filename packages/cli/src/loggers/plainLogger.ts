import { relative } from 'node:path'
import { formatMs } from '@internals/utils'
import { Diagnostics, logLevel as logLevelMap } from '@kubb/core'
import type { Logger } from './defineLogger.ts'
import { createHookTimer, formatCommandWithArgs, formatErrorFrames, formatMessage, formatVersions, getInputPath, pluralize } from './utils.ts'

/**
 * Plain console adapter for non-TTY environments, built on `console.log`. Prints the same ordered
 * phases and the same per-config group boundaries as `clackLogger`, without the animation.
 */
export const plainLogger = {
  name: 'plain',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const hookTimer = createHookTimer()
    const state = {
      /**
       * Name of the config whose group is open, used to close it with the summary.
       */
      configName: '',
      /**
       * Set when a hook or an error lands inside the current phase, so its end line can report the
       * failure. Reset at each phase start.
       */
      phaseFailed: false,
    }

    function getMessage(message: string): string {
      return formatMessage(message, logLevel)
    }

    function startPhase(message: string) {
      state.phaseFailed = false

      if (logLevel <= logLevelMap.silent) {
        return
      }
      console.log(getMessage(message))
    }

    function endPhase({ success, failure }: { success: string; failure: string }) {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      console.log(getMessage(state.phaseFailed ? `✗ ${failure}` : `✓ ${success}`))
    }

    context.hook('kubb:info', ({ message, info }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(['ℹ', message, info].join(' '))

      console.log(text)
    })

    context.hook('kubb:success', ({ message, info = '' }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(['✓', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.hook('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      const text = getMessage(['⚠', message, logLevel >= logLevelMap.info ? info : undefined].filter(Boolean).join(' '))

      console.log(text)
    })

    context.hook('kubb:error', ({ error }) => {
      state.phaseFailed = true

      const text = getMessage(['✗', error.message].join(' '))

      console.log(text)

      const frames = logLevel >= logLevelMap.verbose ? formatErrorFrames(error) : null
      if (frames) {
        for (const frame of frames.frames) {
          console.log(getMessage(frame))
        }

        if (frames.cause) {
          console.log(frames.cause.header)

          for (const frame of frames.cause.frames) {
            console.log(getMessage(`    ${frame}`))
          }
        }
      }
    })

    context.hook('kubb:diagnostic', ({ diagnostic }) => {
      // Silent still surfaces errors so failures stay visible. It drops warnings and info.
      if (logLevel <= logLevelMap.silent && diagnostic.severity !== 'error') {
        return
      }
      console.log(getMessage(Diagnostics.formatLines(diagnostic).join('\n')))
    })

    // A `kubb studio` session emits these on the same emitter as its generations, so one logger
    // renders the whole command. Nothing to animate here, so no spinner.
    context.hook('studio:connecting', ({ url }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      console.log(getMessage(`Connecting to ${url}`))
    })

    context.hook('studio:connected', ({ url, versions }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      console.log(getMessage(`✓ Connected to ${url} (${formatVersions(versions)})`))
    })

    context.hook('studio:ready', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      console.log(getMessage('✓ Ready to receive jobs'))
    })

    context.hook('studio:disconnected', ({ reason }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }
      console.log(getMessage(`⚠ Kubb Studio ended the session (${reason})`))
    })

    context.hook('studio:command:start', ({ command }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      console.log(getMessage(`Kubb Studio asked to ${command}`))
    })

    context.hook('studio:command:end', ({ command, info }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      console.log(getMessage(`✓ Finished ${command}${info ? ` (${info})` : ''}`))
    })

    context.hook('studio:warn', ({ message }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }
      console.log(getMessage(`⚠ ${message}`))
    })

    // Unguarded, like `kubb:error`: a failure stays visible even at silent.
    context.hook('studio:error', ({ error }) => {
      console.log(getMessage(`✗ ${error.message}`))
    })

    context.hook('kubb:generation:start', ({ config }) => {
      state.configName = config.name ?? ''
      state.phaseFailed = false

      if (logLevel <= logLevelMap.silent) {
        return
      }

      console.log(getMessage(['Generation started', config.name ? `for ${config.name}` : undefined, getInputPath(config)].filter(Boolean).join(' ')))
    })

    context.hook('kubb:plugin:start', ({ plugin }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }
      const text = getMessage(`Generating ${plugin.name}`)

      console.log(text)
    })

    context.hook('kubb:plugin:end', ({ plugin, duration, success }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const durationStr = formatMs(duration)
      const text = getMessage(success ? `✓ ${plugin.name} completed in ${durationStr}` : `✗ ${plugin.name} failed in ${durationStr}`)

      console.log(text)
    })

    context.hook('kubb:files:processing:start', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(`Writing ${pluralize(files.length, 'file')}`)

      console.log(text)
    })

    context.hook('kubb:files:processing:update', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      for (const { file, config } of files) {
        console.log(getMessage(`Writing ${relative(config.root, file.path)}`))
      }
    })

    context.hook('kubb:files:processing:end', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(`✓ Wrote ${pluralize(files.length, 'file')}`)

      console.log(text)
    })

    context.hook('kubb:format:start', () => startPhase('Format started'))
    context.hook('kubb:format:end', () => endPhase({ success: 'Format completed', failure: 'Format failed' }))
    context.hook('kubb:lint:start', () => startPhase('Lint started'))
    context.hook('kubb:lint:end', () => endPhase({ success: 'Lint completed', failure: 'Lint failed' }))
    context.hook('kubb:hooks:start', () => startPhase('Hooks started'))
    context.hook('kubb:hooks:end', () => endPhase({ success: 'Hooks completed', failure: 'Hooks failed' }))

    context.hook('kubb:hook:start', ({ id, command, name, args }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      if (id) {
        hookTimer.start(id)
      }

      const commandWithArgs = formatCommandWithArgs(command, args)
      console.log(getMessage(`Hook ${name ?? commandWithArgs} started`))
    })

    context.hook('kubb:hook:end', ({ id, command, name, args, success, error, stdout, stderr }) => {
      if (!success) {
        state.phaseFailed = true
      }

      if (logLevel <= logLevelMap.silent) {
        return
      }

      const ms = id ? hookTimer.end(id) : undefined
      const durationStr = ms !== undefined ? ` in ${formatMs(ms)}` : ''

      const commandWithArgs = formatCommandWithArgs(command, args)

      if (success) {
        console.log(getMessage(`✓ Hook ${name ?? commandWithArgs} completed${durationStr}`))
        return
      }

      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
      const reason = error?.message ? ` (${error.message})` : ''
      console.log(getMessage(`✗ Hook ${name ?? commandWithArgs} failed${durationStr}${reason}`))
    })

    return {
      /**
       * Prints the summary under the config's phases, then the line that closes its group.
       */
      renderSummary(lines, { title, status }) {
        if (logLevel <= logLevelMap.silent) {
          return
        }

        console.log('')
        if (title) {
          console.log(title)
        }
        for (const line of lines) {
          console.log(line)
        }

        const name = state.configName ? ` for ${state.configName}` : ''
        console.log(getMessage(status === 'failed' ? `✗ Generation failed${name}` : `✓ Generation succeeded${name}`))
        state.configName = ''
      },
    }
  },
} satisfies Logger
