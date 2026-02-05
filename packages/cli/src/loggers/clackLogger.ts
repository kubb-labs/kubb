import { relative } from 'node:path'
import process from 'node:process'
import * as clack from '@clack/prompts'
import { defineLogger, LogLevel } from '@kubb/core'
import { formatHrtime, formatMs } from '@kubb/core/utils'
import { execa } from 'execa'
import pc from 'picocolors'
import { formatMsWithColor } from '../utils/formatMsWithColor.ts'
import { getIntro } from '../utils/getIntro.ts'
import { getSummary } from '../utils/getSummary.ts'
import { ClackWritable } from '../utils/Writables.ts'

/**
 * Clack adapter for local TTY environments
 * Provides a beautiful CLI UI with flat structure inspired by Claude's CLI patterns
 */
export const clackLogger = defineLogger({
  name: 'clack',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const state = {
      totalPlugins: 0,
      completedPlugins: 0,
      failedPlugins: 0,
      totalFiles: 0,
      processedFiles: 0,
      hrStart: process.hrtime(),
      spinner: clack.spinner(),
      isSpinning: false,
      activeProgress: new Map<string, { interval?: NodeJS.Timeout; progressBar: clack.ProgressResult }>(),
    }

    function reset() {
      for (const [_key, active] of state.activeProgress) {
        if (active.interval) {
          clearInterval(active.interval)
        }
        active.progressBar?.stop()
      }

      state.totalPlugins = 0
      state.completedPlugins = 0
      state.failedPlugins = 0
      state.totalFiles = 0
      state.processedFiles = 0
      state.hrStart = process.hrtime()
      state.spinner = clack.spinner()
      state.isSpinning = false
      state.activeProgress.clear()
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
        clack.log.step(getMessage(parts.join(pc.dim(' | '))))
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

    function startSpinner(text?: string) {
      state.spinner.start(text)
      state.isSpinning = true
    }

    function stopSpinner(text?: string) {
      state.spinner.stop(text)
      state.isSpinning = false
    }

    context.on('info', (message, info = '') => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage([pc.blue('ℹ'), message, pc.dim(info)].join(' '))

      if (state.isSpinning) {
        state.spinner.message(text)
      } else {
        clack.log.info(text)
      }
    })

    context.on('success', (message, info = '') => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage([pc.blue('✓'), message, logLevel >= LogLevel.info ? pc.dim(info) : undefined].filter(Boolean).join(' '))

      if (state.isSpinning) {
        stopSpinner(text)
      } else {
        clack.log.success(text)
      }
    })

    context.on('warn', (message, info) => {
      if (logLevel < LogLevel.warn) {
        return
      }

      const text = getMessage([pc.yellow('⚠'), message, logLevel >= LogLevel.info ? pc.dim(info) : undefined].filter(Boolean).join(' '))

      clack.log.warn(text)
    })

    context.on('error', (error) => {
      const caused = error.cause as Error

      const text = [pc.red('✗'), error.message].join(' ')

      if (state.isSpinning) {
        stopSpinner(getMessage(text))
      } else {
        clack.log.error(getMessage(text))
      }

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= LogLevel.debug && error.stack) {
        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          clack.log.message(getMessage(pc.dim(frame.trim())))
        }

        if (caused?.stack) {
          clack.log.message(pc.dim(`└─ caused by ${caused.message}`))

          const frames = caused.stack.split('\n').slice(1, 4)
          for (const frame of frames) {
            clack.log.message(getMessage(`    ${pc.dim(frame.trim())}`))
          }
        }
      }
    })

    context.on('version:new', (version, latestVersion) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      clack.box(
        `\`v${version}\` → \`v${latestVersion}\`
Run \`npm install -g @kubb/cli\` to update`,
        'Update available for `Kubb`',
        {
          width: 'auto',
          formatBorder: pc.yellow,
          rounded: true,
          withGuide: false,
          contentAlign: 'center',
          titleAlign: 'center',
        },
      )
    })

    context.on('lifecycle:start', async (version) => {
      console.log(`\n${getIntro({ title: 'The ultimate toolkit for working with APIs', description: 'Ready to start', version, areEyesOpen: true })}\n`)

      reset()
    })

    context.on('config:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration started')

      clack.intro(text)
      startSpinner(getMessage('Configuration loading'))
    })

    context.on('config:end', (_configs) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      clack.outro(text)
    })

    context.on('generation:start', (config) => {
      // Initialize progress tracking
      state.totalPlugins = config.plugins?.length || 0

      const text = getMessage(['Generation started', config.name ? `for ${pc.dim(config.name)}` : undefined].filter(Boolean).join(' '))

      clack.intro(text)
      reset()
    })

    context.on('plugin:start', (plugin) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      stopSpinner()

      const progressBar = clack.progress({
        style: 'block',
        max: 100,
        size: 30,
      })
      const text = getMessage(`Generating ${pc.bold(plugin.name)}`)
      progressBar.start(text)

      const interval = setInterval(() => {
        progressBar.advance()
      }, 100)

      state.activeProgress.set(plugin.name, { progressBar, interval })
    })

    context.on('plugin:end', (plugin, { duration, success }) => {
      stopSpinner()

      const active = state.activeProgress.get(plugin.name)

      if (!active || logLevel === LogLevel.silent) {
        return
      }

      clearInterval(active.interval)

      if (success) {
        state.completedPlugins++
      } else {
        state.failedPlugins++
      }

      const durationStr = formatMsWithColor(duration)
      const text = getMessage(
        success ? `${pc.bold(plugin.name)} completed in ${durationStr}` : `${pc.bold(plugin.name)} failed in ${pc.red(formatMs(duration))}`,
      )

      active.progressBar.stop(text)
      state.activeProgress.delete(plugin.name)

      // Show progress step after each plugin
      showProgressStep()
    })

    context.on('files:processing:start', (files) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      stopSpinner()

      state.totalFiles = files.length
      state.processedFiles = 0

      const text = `Writing ${files.length} files`
      const progressBar = clack.progress({
        style: 'block',
        max: files.length,
        size: 30,
      })

      context.emit('info', text)
      progressBar.start(getMessage(text))
      state.activeProgress.set('files', { progressBar })
    })

    context.on('file:processing:update', ({ file, config }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      stopSpinner()

      state.processedFiles++

      const text = `Writing ${relative(config.root, file.path)}`
      const active = state.activeProgress.get('files')

      if (!active) {
        return
      }

      active.progressBar.advance(undefined, text)
    })
    context.on('files:processing:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      stopSpinner()

      const text = getMessage('Files written successfully')
      const active = state.activeProgress.get('files')

      if (!active) {
        return
      }

      active.progressBar.stop(text)
      state.activeProgress.delete('files')

      // Show final progress step after files are written
      showProgressStep()
    })

    context.on('generation:end', (config) => {
      const text = getMessage(config.name ? `Generation completed for ${pc.dim(config.name)}` : 'Generation completed')

      clack.outro(text)
    })

    context.on('format:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Format started')

      clack.intro(text)
    })

    context.on('format:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Format completed')

      clack.outro(text)
    })

    context.on('lint:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Lint started')

      clack.intro(text)
    })

    context.on('lint:end', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Lint completed')

      clack.outro(text)
    })

    context.on('hook:start', async ({ id, command, args }) => {
      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      const text = getMessage(`Hook ${pc.dim(commandWithArgs)} started`)

      // Skip hook execution if no id is provided (e.g., during benchmarks or tests)
      if (!id) {
        return
      }

      if (logLevel <= LogLevel.silent) {
        try {
          const result = await execa(command, args, {
            detached: true,
            stripFinalNewline: true,
          })

          await context.emit('debug', {
            date: new Date(),
            logs: [result.stdout],
          })

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

        return
      }

      clack.intro(text)

      const logger = clack.taskLog({
        title: getMessage(['Executing hook', logLevel >= LogLevel.info ? pc.dim(commandWithArgs) : undefined].filter(Boolean).join(' ')),
      })

      const writable = new ClackWritable(logger)

      try {
        const result = await execa(command, args, {
          detached: true,
          stdout: ['pipe', writable],
          stripFinalNewline: true,
        })

        await context.emit('debug', {
          date: new Date(),
          logs: [result.stdout],
        })

        await context.emit('hook:end', { command, args, id, success: true, error: null })
      } catch (err) {
        const error = new Error('Hook execute failed')
        error.cause = err

        await context.emit('debug', {
          date: new Date(),
          logs: [(err as any).stdout],
        })

        await context.emit('hook:end', { command, args, id, success: true, error })
        await context.emit('error', error)
      }
    })

    context.on('hook:end', ({ command, args }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command
      const text = getMessage(`Hook ${pc.dim(commandWithArgs)} successfully executed`)

      clack.outro(text)
    })

    context.on('generation:summary', (config, { pluginTimings, failedPlugins, filesCreated, status, hrStart }) => {
      const summary = getSummary({
        failedPlugins,
        filesCreated,
        config,
        status,
        hrStart,
        pluginTimings: logLevel >= LogLevel.verbose ? pluginTimings : undefined,
      })
      const title = config.name || ''

      summary.unshift('\n')
      summary.push('\n')

      if (status === 'success') {
        clack.box(summary.join('\n'), getMessage(title), {
          width: 'auto',
          formatBorder: pc.green,
          rounded: true,
          withGuide: false,
          contentAlign: 'left',
          titleAlign: 'center',
        })

        return
      }

      clack.box(summary.join('\n'), getMessage(title), {
        width: 'auto',
        formatBorder: pc.red,
        rounded: true,
        withGuide: false,
        contentAlign: 'left',
        titleAlign: 'center',
      })
    })

    context.on('lifecycle:end', () => {
      reset()
    })
  },
})
