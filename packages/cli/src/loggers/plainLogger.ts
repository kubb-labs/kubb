import { relative } from 'node:path'
import { formatMs } from '@internals/utils'
import { Diagnostics, logLevel as logLevelMap } from '@kubb/core'
import type { Logger } from './defineLogger.ts'
import { createHookTimer, createLogHelpers, formatCommandWithArgs, formatErrorFrames } from './utils.ts'

/**
 * Plain console adapter for non-TTY environments, built on `console.log`.
 */
export const plainLogger = {
  name: 'plain',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const hookTimer = createHookTimer()
    const { getMessage, onStep } = createLogHelpers({ context, logLevel, print: (text) => console.log(text) })

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

    context.hook('kubb:lifecycle:start', ({ version }) => {
      console.log(`Kubb CLI v${version}`)
    })

    context.hook('kubb:generation:start', () => {
      const text = getMessage('Generation started')

      console.log(text)
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
      const text = getMessage(success ? `${plugin.name} completed in ${durationStr}` : `${plugin.name} failed in ${durationStr}`)

      console.log(text)
    })

    context.hook('kubb:files:processing:start', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(`Writing ${files.length} files`)

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

    context.hook('kubb:files:processing:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Files written successfully')

      console.log(text)
    })

    context.hook('kubb:generation:end', ({ config }) => {
      const text = getMessage(config.name ? `Generation completed for ${config.name}` : 'Generation completed')

      console.log(text)
    })

    onStep('kubb:format:start', 'Format started')
    onStep('kubb:format:end', 'Format completed')
    onStep('kubb:lint:start', 'Lint started')
    onStep('kubb:lint:end', 'Lint completed')
    onStep('kubb:hooks:start', 'Hooks started')
    onStep('kubb:hooks:end', 'Hooks completed')

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
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const ms = id ? hookTimer.end(id) : undefined
      const durationStr = ms !== undefined ? ` in ${formatMs(ms)}` : ''

      const commandWithArgs = formatCommandWithArgs(command, args)

      if (success) {
        console.log(getMessage(`✓ Hook ${name ?? commandWithArgs} completed${durationStr}`))
      } else {
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)
        const reason = error?.message ? ` (${error.message})` : ''
        console.log(getMessage(`✗ Hook ${name ?? commandWithArgs} failed${durationStr}${reason}`))
      }
    })
  },
} satisfies Logger
