import * as clack from '@clack/prompts'
import { defineLogger, LogLevel } from '@kubb/core'
import { execa } from 'execa'
import { default as gradientString } from 'gradient-string'
import pc from 'picocolors'
import { ClackWritable } from '../utils/Writables.ts'

/**
 * Clack adapter for local TTY environments
 * Provides a beautiful CLI UI with flat structure inspired by Claude's CLI patterns
 *
 */
export const clackLogger = defineLogger({
  name: 'clack',
  install(context, options) {
    const logLevel = options?.logLevel || LogLevel.info
    const errorCount = { value: 0 }
    const warningCount = { value: 0 }
    const activeProgress = new Map<string, any>()

    context.on('lifecycle:start', () => {
      console.log('logLevel', logLevel)
      console.log(gradientString(['#F58517', '#F5A217', '#F55A17'])('Kubb CLI 🧩'))

      clack.intro(pc.bold('Kubb started'))
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

    context.on('lifecycle:end', () => {
      // Show summary with error/warning counts if any
      if (errorCount.value > 0 || warningCount.value > 0) {
        const parts: string[] = []
        if (errorCount.value > 0) {
          parts.push(pc.red(`${errorCount.value} error${errorCount.value > 1 ? 's' : ''}`))
        }
        if (warningCount.value > 0) {
          parts.push(pc.yellow(`${warningCount.value} warning${warningCount.value > 1 ? 's' : ''}`))
        }
        clack.outro(`${'Kubb completed'} ${pc.dim('with')} ${parts.join(pc.dim(' and '))}`)
      } else {
        clack.outro(pc.green('Kubb completed'))
      }
    })

    context.on('hook:execute', async (command, args, cb) => {
      const logger = clack.taskLog({
        title: ['Executing hook', logLevel !== LogLevel.silent ? pc.dim(`${command} ${args.join(' ')}`) : undefined].filter(Boolean).join(' '),
      })

      const writable = new ClackWritable(logger)

      const result = await execa(command, args, {
        detached: true,
        stdout: logLevel === LogLevel.silent ? undefined : ['pipe', writable],
        stripFinalNewline: true,
      })

      cb(result)
    })

    context.on('success', (message) => {
      clack.log.success(`${pc.green('✓')} ${message}`)
    })

    context.on('warn', (message) => {
      if (logLevel >= LogLevel.warn) {
        warningCount.value++
        clack.log.warn(`${pc.yellow('⚠')} ${message}`)
      }
    })

    context.on('error', (error, _opts) => {
      errorCount.value++
      clack.log.error(`${pc.red('✗')} ${pc.bold(error.message)}`)

      // Show error details with indentation
      if (error.message) {
        clack.log.message(`  ${pc.dim('└─')} ${pc.red(error.message)}`)
      }

      // Show stack trace in debug mode (first 3 frames)
      if (logLevel >= LogLevel.debug && error.stack) {
        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          clack.log.message(`     ${pc.dim(frame.trim())}`)
        }
      }
    })

    context.on('info', (message) => {
      if (logLevel >= LogLevel.info) {
        clack.log.info(`${pc.blue('ℹ')} ${message}`)
      }
    })

    context.on('verbose', (message) => {
      if (logLevel >= LogLevel.verbose) {
        const timestamp = new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        clack.log.message(`${pc.dim(`[${timestamp}]`)} ${pc.cyan('verbose')}`)
        clack.log.message(message)
      }
    })

    context.on('debug', (message) => {
      if (logLevel >= LogLevel.debug) {
        const category = 'debug'
        const prefix = pc.dim(`[${category}]`)
        const formattedLogs = message.logs.map((log) => `${prefix} ${log}`).join('\n')
        clack.log.message(formattedLogs)
      }
    })

    context.on('plugin:start', (plugin) => {
      // Create progress bar for plugin execution
      const progressBar = clack.progress({
        style: 'block',
        max: 100,
        size: 30,
      })
      progressBar.start(`Generating ${plugin.name}...`)

      const interval = setInterval(() => {
        progressBar.advance()
      }, 50)

      activeProgress.set(plugin.name, { progressBar, interval })
    })

    context.on('plugin:end', (plugin, duration) => {
      const active = activeProgress.get(plugin.name)
      if (active) {
        clearInterval(active.interval)
        const durationStr = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`
        active.progressBar.stop(`${plugin.name} completed in ${durationStr}`)
        activeProgress.delete(plugin.name)
      }
    })

    // File processing progress
    context.on('files:processing:start', ({ files }) => {
      const progressBar = clack.progress({
        style: 'heavy',
        max: files.length,
        size: 30,
        indicator: undefined,
      })
      progressBar.start(`Writing ${files.length} files...`)
      activeProgress.set('files', { progressBar })
    })

    context.on('file:processing:update', () => {
      const active = activeProgress.get('files')
      if (active) {
        active.progressBar.advance()
      }
    })

    context.on('files:processing:end', () => {
      const active = activeProgress.get('files')
      if (active) {
        active.progressBar.stop('Files written successfully')
        activeProgress.delete('files')
      }
    })

    context.on('lifecycle:end', () => {
      for (const [_key, active] of activeProgress) {
        if (active.interval) {
          clearInterval(active.interval)
        }
        if (active.progressBar) {
          active.progressBar.stop()
        }
      }
      activeProgress.clear()
    })
  },
})
