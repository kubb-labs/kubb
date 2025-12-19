import { relative } from 'node:path'
import process from 'node:process'
import * as clack from '@clack/prompts'
import { defineLogger, LogLevel } from '@kubb/core'
import { execa } from 'execa'
import { default as gradientString } from 'gradient-string'
import pc from 'picocolors'

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
    const activeProgress = new Map<string, { interval?: NodeJS.Timeout; progressBar: clack.ProgressResult }>()
    const spinner = clack.spinner()
    let isSpinning = false

    // Progress tracking state
    let totalPlugins = 0
    let completedPlugins = 0
    let failedPlugins = 0
    let totalFiles = 0
    let processedFiles = 0
    let hrStart: [number, number] = process.hrtime()
    let isGenerating = false

    function showProgressStep() {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const parts: string[] = []
      const duration = ((hrtime) => {
        const [seconds, nanoseconds] = process.hrtime(hrtime)
        return Math.round(seconds * 1000 + nanoseconds / 1e6)
      })(hrStart)

      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

      if (totalPlugins > 0) {
        const pluginStr =
          failedPlugins > 0
            ? `Plugins ${pc.green(completedPlugins.toString())}/${totalPlugins} ${pc.red(`(${failedPlugins} failed)`)}`
            : `Plugins ${pc.green(completedPlugins.toString())}/${totalPlugins}`
        parts.push(pluginStr)
      }

      if (totalFiles > 0) {
        parts.push(`Files ${pc.green(processedFiles.toString())}/${totalFiles}`)
      }

      if (parts.length > 0) {
        parts.push(pc.green(durationStr))
        clack.log.step(parts.join(pc.dim(' | ')))
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
      spinner.start(text)
      isSpinning = true
    }

    function stopSpinner(text?: string) {
      spinner.stop(text)
      isSpinning = false
    }

    context.on('info', (message, info = '') => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage([pc.blue('ℹ'), message, pc.dim(info)].join(' '))

      if (isSpinning) {
        spinner.message(text)
      } else {
        clack.log.info(text)
      }
    })

    context.on('success', (message, info = '') => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage([pc.blue('✓'), message, logLevel >= LogLevel.info ? pc.dim(info) : undefined].filter(Boolean).join(' '))

      if (isSpinning) {
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

      if (isSpinning) {
        stopSpinner(getMessage(text))
      } else {
        clack.log.error(getMessage(text))
      }

      // Track plugin failures during generation
      if (isGenerating && totalPlugins > 0 && completedPlugins + failedPlugins < totalPlugins) {
        failedPlugins++
        showProgressStep()
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

    context.on('lifecycle:start', (version) => {
      console.log(gradientString(['#F58517', '#F5A217', '#F55A17'])(`Kubb ${version} 🧩`))
    })

    context.on('config:start', () => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration started')

      clack.intro(text)
      startSpinner(getMessage('Configuration loading'))
    })

    context.on('config:end', (configs) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      clack.outro(text)

      // Initialize progress tracking
      totalPlugins = configs.reduce((sum, config) => sum + (config.plugins?.length || 0), 0)
      completedPlugins = 0
      failedPlugins = 0
      hrStart = process.hrtime()
    })

    context.on('generation:start', (config) => {
      isGenerating = true
      const text = getMessage(['Generation started', config.name ? `for ${pc.dim(config.name)}` : undefined].filter(Boolean).join(' '))

      clack.intro(text)
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
      }, 50)

      activeProgress.set(plugin.name, { progressBar, interval })
    })

    context.on('plugin:end', (plugin, duration) => {
      stopSpinner()

      const active = activeProgress.get(plugin.name)

      if (!active || logLevel === LogLevel.silent) {
        return
      }

      clearInterval(active.interval)

      completedPlugins++

      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`
      const text = getMessage(`${pc.bold(plugin.name)} completed in ${pc.green(durationStr)}`)

      active.progressBar.stop(text)
      activeProgress.delete(plugin.name)

      // Show progress step after each plugin
      showProgressStep()
    })

    context.on('files:processing:start', (files) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      stopSpinner()

      totalFiles = files.length
      processedFiles = 0

      const text = `Writing ${files.length} files`
      const progressBar = clack.progress({
        style: 'block',
        max: files.length,
        size: 30,
      })

      context.emit('info', text)
      progressBar.start(getMessage(text))
      activeProgress.set('files', { progressBar })
    })

    context.on('file:processing:update', ({ file, config }) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      stopSpinner()

      processedFiles++

      const text = `Writing ${relative(config.root, file.path)}`
      const active = activeProgress.get('files')

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
      const active = activeProgress.get('files')

      if (!active) {
        return
      }

      active.progressBar.stop(text)
      activeProgress.delete('files')

      // Show final progress step after files are written
      showProgressStep()
    })

    context.on('generation:end', (config) => {
      isGenerating = false
      const text = getMessage(config.name ? `Generation completed for ${pc.dim(config.name)}` : 'Generation completed')

      clack.outro(text)
    })

    context.on('hook:execute', async ({ command, args }, cb) => {
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

          cb()
        } catch (err) {
          const error = new Error('Hook execute failed')
          error.cause = err

          await context.emit('debug', {
            date: new Date(),
            logs: [(err as any).stdout],
          })

          await context.emit('error', error)
        }

        return
      }

      const logger = clack.taskLog({
        title: getMessage(['Executing hook', logLevel >= LogLevel.info ? pc.dim(`${command} ${args?.join(' ')}`) : undefined].filter(Boolean).join(' ')),
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

        cb()
      } catch (err) {
        const error = new Error('Hook execute failed')
        error.cause = err

        await context.emit('debug', {
          date: new Date(),
          logs: [(err as any).stdout],
        })

        await context.emit('error', error)
      }
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

    context.on('hook:start', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Hook ${pc.dim(command)} started`)

      clack.intro(text)
    })

    context.on('hook:end', (command) => {
      if (logLevel <= LogLevel.silent) {
        return
      }

      const text = getMessage(`Hook ${pc.dim(command)} completed`)

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
      for (const [_key, active] of activeProgress) {
        if (active.interval) {
          clearInterval(active.interval)
        }
        active.progressBar?.stop()
      }
      activeProgress.clear()
    })
  },
})
