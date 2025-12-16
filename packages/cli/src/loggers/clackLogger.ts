import { relative } from 'node:path'
import * as clack from '@clack/prompts'
import { defineLogger, LogLevel } from '@kubb/core'
import { execa } from 'execa'
import { default as gradientString } from 'gradient-string'
import pc from 'picocolors'
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
      spinner.cancel(text)
      isSpinning = false
    }

    context.on('info', (message, info = '') => {
      const text = [pc.blue('ℹ'), message, pc.dim(info)].join(' ')

      if (logLevel >= LogLevel.info) {
        if (isSpinning) {
          spinner.message(getMessage(text))
        } else {
          clack.log.info(getMessage(text))
        }
      }
    })

    context.on('success', (message, info = '') => {
      const text = [pc.blue('✓'), message, logLevel >= LogLevel.info ? pc.dim(info) : undefined].filter(Boolean).join(' ')

      if (isSpinning) {
        stopSpinner(getMessage(text))
      } else {
        clack.log.success(getMessage(text))
      }
    })

    context.on('warn', (message, info) => {
      const text = [pc.yellow('⚠'), message, logLevel >= LogLevel.info ? pc.dim(info) : undefined].filter(Boolean).join(' ')

      if (logLevel >= LogLevel.warn) {
        clack.log.warn(getMessage(text))
      }
    })

    context.on('error', (error) => {
      const caused = error.cause as Error

      const text = [pc.red('✗'), error.message].join(' ')

      if (isSpinning) {
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

    context.on('lifecycle:start', () => {
      console.log(gradientString(['#F58517', '#F5A217', '#F55A17'])('Kubb CLI 🧩'))
    })

    context.on('config:start', () => {
      clack.intro(getMessage('Configuration started'))
      startSpinner(getMessage('Configuration loading'))
    })

    context.on('config:end', () => {
      clack.outro(getMessage('Configuration completed'))
    })

    context.on('generation:start', () => {
      clack.intro(getMessage('Generation started'))
    })

    context.on('plugin:start', (plugin) => {
      stopSpinner()

      const progressBar = clack.progress({
        style: 'block',
        max: 100,
        size: 30,
      })
      progressBar.start(getMessage(`Generating ${pc.bold(plugin.name)}`))

      const interval = setInterval(() => {
        progressBar.advance()
      }, 50)

      activeProgress.set(plugin.name, { progressBar, interval })
    })

    context.on('plugin:end', (plugin, duration) => {
      stopSpinner()

      const active = activeProgress.get(plugin.name)

      if (!active) {
        return
      }

      clearInterval(active.interval)

      const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`

      active.progressBar.stop(getMessage(`${pc.bold(plugin.name)} completed in ${pc.dim(durationStr)}`))
      activeProgress.delete(plugin.name)
    })

    context.on('files:processing:start', ({ files }) => {
      stopSpinner()

      const text = `Writing ${files.length} files`
      const progressBar = clack.progress({
        style: 'block',
        max: files.length,
        size: 30,
      })

      context.emit('info', getMessage(text))
      progressBar.start(getMessage(text))
      activeProgress.set('files', { progressBar })
    })

    context.on('file:processing:update', ({ file, config }) => {
      stopSpinner()

      const text = `Writing ${relative(config.root, file.path)}`
      const active = activeProgress.get('files')

      if (!active) {
        return
      }

      active.progressBar.advance(undefined, text)
    })
    context.on('files:processing:end', () => {
      stopSpinner()

      const text = 'Files written successfully'
      const active = activeProgress.get('files')

      if (!active) {
        return
      }

      active.progressBar.stop(getMessage(text))

      context.emit('success', getMessage(text))
      activeProgress.delete('files')
    })

    context.on('generation:end', ({ summary, title, success }) => {
      clack.outro(getMessage('Generation completed'))

      if (success) {
        clack.box(summary.join(''), getMessage(title), {
          width: 'auto',
          formatBorder: pc.green,
          rounded: true,
          withGuide: false,
          contentAlign: 'left',
          titleAlign: 'center',
        })

        return
      }

      clack.box(summary.join(''), getMessage(title), {
        width: 'auto',
        formatBorder: pc.red,
        rounded: true,
        withGuide: false,
        contentAlign: 'left',
        titleAlign: 'center',
      })
    })

    context.on('hook:execute', async ({ command, args }, cb) => {
      const logger = clack.taskLog({
        title: getMessage(['Executing hook', logLevel >= LogLevel.info ? pc.dim(`${command} ${args?.join(' ')}`) : undefined].filter(Boolean).join(' ')),
      })

      const writable = new ClackWritable(logger)

      try {
        const result = await execa(command, args, {
          detached: true,
          stdout: logLevel === LogLevel.silent || logLevel === LogLevel.verbose ? undefined : ['pipe', writable],
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
      clack.intro(getMessage('Format started'))
    })

    context.on('format:end', () => {
      clack.outro(getMessage('Format completed'))
    })

    context.on('lint:start', () => {
      clack.intro(getMessage('Lint started'))
    })

    context.on('lint:end', () => {
      clack.outro(getMessage('Lint completed'))
    })

    context.on('hook:start', (command) => {
      clack.intro(getMessage(`Hook ${pc.dim(command)} started`))
    })

    context.on('hook:end', (command) => {
      clack.outro(getMessage(`Hook ${pc.dim(command)} completed`))
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
