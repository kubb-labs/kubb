import { relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { formatMsWithColor, getElapsedMs, getIntro, toCause } from '@internals/utils'
import { defineLogger, Diagnostics, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import { buildProgressLine, createProgressCounters, formatCommandWithArgs, formatMessage, recordPluginResult, resetProgressCounters } from './utils.ts'

/**
 * TTY logger with beautiful UI and progress indicators for local development.
 */
export const clackLogger = defineLogger({
  name: 'clack',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const state = {
      ...createProgressCounters(),
      spinner: clack.spinner(),
      isSpinning: false,
      runningPlugins: new Set<string>(),
      activeProgress: new Map<string, { interval?: NodeJS.Timeout; progressBar: clack.ProgressResult }>(),
      activeHookLogs: new Map<string, { taskLog: ReturnType<typeof clack.taskLog>; hrStart: [number, number] }>(),
    }

    // Clear every active progress bar's interval, stop it, and drop the map.
    function stopActiveProgress() {
      for (const [, active] of state.activeProgress) {
        if (active.interval) {
          clearInterval(active.interval)
        }
        active.progressBar?.stop()
      }
      state.activeProgress.clear()
    }

    function reset() {
      stopActiveProgress()

      resetProgressCounters(state)
      state.spinner = clack.spinner()
      state.isSpinning = false
      state.runningPlugins.clear()
      state.activeHookLogs.clear()
    }

    // Label for the shared plugin bar, listing the plugins currently generating.
    function pluginProgressText(): string {
      const running = [...state.runningPlugins].map((name) => styleText('bold', name))
      return getMessage(running.length > 0 ? `Generating ${running.join(', ')}` : 'Generating plugins')
    }

    function showProgressStep() {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const line = buildProgressLine(state)
      if (line) {
        clack.log.step(getMessage(line))
      }
    }

    function getMessage(message: string): string {
      return formatMessage(message, logLevel)
    }

    // Registers a handler that prints a fixed step message, skipped at silent level.
    function onStep<E extends keyof KubbHooks>(event: E, message: string): void {
      context.on(event, () => {
        if (logLevel <= logLevelMap.silent) {
          return
        }
        clack.log.step(getMessage(message))
      })
    }

    function startSpinner(text?: string) {
      state.spinner.start(text)
      state.isSpinning = true
    }

    function stopSpinner(text?: string) {
      if (!state.isSpinning) {
        return
      }
      state.spinner.stop(text)
      state.isSpinning = false
    }

    context.on('kubb:info', ({ message, info = '' }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage([styleText('blue', 'ℹ'), message, info ? styleText('dim', info) : undefined].filter(Boolean).join(' '))

      if (state.isSpinning) {
        state.spinner.message(text)
        return
      }
      clack.log.info(text)
    })

    context.on('kubb:success', ({ message, info = '' }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage([styleText('blue', '✓'), message, logLevel >= logLevelMap.info ? styleText('dim', info) : undefined].filter(Boolean).join(' '))

      if (state.isSpinning) {
        stopSpinner(text)
        return
      }
      clack.log.success(text)
    })

    context.on('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      const text = getMessage(
        [styleText('yellow', '⚠'), message, logLevel >= logLevelMap.info && info ? styleText('dim', info) : undefined].filter(Boolean).join(' '),
      )

      clack.log.warn(text)
    })

    context.on('kubb:error', ({ error }) => {
      const caused = toCause(error)

      const text = [styleText('red', '✗'), error.message].join(' ')

      if (state.isSpinning) {
        stopSpinner(getMessage(text))
        return
      }
      clack.log.error(getMessage(text))

      // Show stack trace in verbose mode (first 3 frames)
      if (logLevel >= logLevelMap.verbose && error.stack) {
        const frames = error.stack.split('\n').slice(1, 4)
        for (const frame of frames) {
          clack.log.message(getMessage(styleText('dim', frame.trim())))
        }

        if (caused?.stack) {
          clack.log.message(styleText('dim', `└─ caused by ${caused.message}`))

          const frames = caused.stack.split('\n').slice(1, 4)
          for (const frame of frames) {
            clack.log.message(getMessage(`    ${styleText('dim', frame.trim())}`))
          }
        }
      }
    })

    context.on('kubb:diagnostic', ({ diagnostic }) => {
      // Silent still surfaces errors so failures stay visible. It drops warnings and info.
      if (logLevel <= logLevelMap.silent && diagnostic.severity !== 'error') {
        return
      }

      stopSpinner()

      // Stop any lingering progress UI so the multi-line block renders cleanly.
      stopActiveProgress()

      // The version-update notice keeps its own framed box instead of the diagnostic gutter.
      if (Diagnostics.isUpdate(diagnostic)) {
        clack.box(
          `\`v${diagnostic.currentVersion}\` → \`v${diagnostic.latestVersion}\`
Run \`npm install -g @kubb/cli\` to update`,
          'Update available for `Kubb`',
          {
            width: 'auto',
            formatBorder: (s: string) => styleText('yellow', s),
            rounded: true,
            withGuide: false,
            contentAlign: 'center',
            titleAlign: 'center',
          },
        )

        return
      }

      // Hand the severity glyph to clack as the gutter `symbol`, then let it draw the
      // bar on each detail line via the default `secondarySymbol`. The headline and
      // details carry their own colors, so clack only owns the gutter.
      const { symbol, headline, details } = Diagnostics.format(diagnostic)
      clack.log.message([headline, ...details], { symbol })
    })

    context.on('kubb:lifecycle:start', async ({ version }) => {
      console.log(`\n${getIntro({ title: 'The meta framework for code generation', description: 'Ready to start', version, areEyesOpen: true })}\n`)

      reset()
    })

    context.on('kubb:config:start', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Configuration started')

      clack.intro(text)
      startSpinner(getMessage('Configuration loading'))
    })

    context.on('kubb:config:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage('Configuration completed')

      clack.outro(text)
    })

    context.on('kubb:generation:start', ({ config }) => {
      reset()

      // Initialize progress tracking for this generation
      state.totalPlugins = config.plugins?.length ?? 0

      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(['Generation started', config.name ? `for ${styleText('dim', config.name)}` : undefined].filter(Boolean).join(' '))

      clack.intro(text)
    })

    // Plugins run concurrently, so they share a single progress bar. A bar per plugin
    // would make clack render them side by side and pile up keypress listeners.
    context.on('kubb:plugin:start', ({ plugin }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      stopSpinner()

      state.runningPlugins.add(plugin.name)

      const active = state.activeProgress.get('plugins')
      if (active) {
        active.progressBar.advance(0, pluginProgressText())
        return
      }

      const progressBar = clack.progress({
        style: 'block',
        max: Math.max(state.totalPlugins, 1),
        size: 30,
      })
      progressBar.start(pluginProgressText())
      // Catch up to plugins already finished before this bar opened.
      progressBar.advance(state.completedPlugins + state.failedPlugins, pluginProgressText())
      state.activeProgress.set('plugins', { progressBar })
    })

    context.on('kubb:plugin:end', ({ plugin, success }) => {
      stopSpinner()

      const active = state.activeProgress.get('plugins')

      if (!active || logLevel === logLevelMap.silent) {
        return
      }

      state.runningPlugins.delete(plugin.name)
      recordPluginResult(state, success)
      active.progressBar.advance(1, pluginProgressText())

      // Close the bar once nothing is generating, then print the progress step.
      if (state.runningPlugins.size === 0) {
        active.progressBar.stop(getMessage('Plugins generated'))
        state.activeProgress.delete('plugins')
        showProgressStep()
      }
    })

    context.on('kubb:files:processing:start', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
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

      context.emit('kubb:info', { message: text })
      progressBar.start(getMessage(text))
      state.activeProgress.set('files', { progressBar })
    })

    context.on('kubb:files:processing:update', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      stopSpinner()

      const active = state.activeProgress.get('files')
      for (const { file, config } of files) {
        state.processedFiles++
        if (active) {
          active.progressBar.advance(undefined, `Writing ${relative(config.root, file.path)}`)
        }
      }
    })
    context.on('kubb:files:processing:end', () => {
      if (logLevel <= logLevelMap.silent) {
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

    context.on('kubb:generation:end', ({ config }) => {
      stopSpinner()

      const text = getMessage(config.name ? `Generation completed for ${styleText('dim', config.name)}` : 'Generation completed')

      clack.outro(text)
    })

    onStep('kubb:format:start', 'Formatting')
    onStep('kubb:lint:start', 'Linting')
    onStep('kubb:hooks:start', 'Running hooks')

    context.on('kubb:hook:start', ({ id, command, args }) => {
      if (logLevel <= logLevelMap.silent || !id) {
        return
      }

      stopSpinner()

      const commandWithArgs = formatCommandWithArgs(command, args)
      const title = getMessage(`Running ${styleText('dim', commandWithArgs)}`)
      const taskLog = clack.taskLog({ title })

      state.activeHookLogs.set(id, { taskLog, hrStart: process.hrtime() })
    })

    // Registered only when not silent, so its presence is what tells the runner to stream
    // (`kubb:hook:line` listenerCount). At silent level no streaming happens, matching the old sink.
    if (logLevel > logLevelMap.silent) {
      context.on('kubb:hook:line', ({ id, line }) => {
        const active = state.activeHookLogs.get(id)
        active?.taskLog.message(styleText('dim', line))
      })
    }

    context.on('kubb:hook:end', ({ id, command, args, success, error, stdout, stderr }) => {
      if (!id) {
        return
      }

      if (logLevel <= logLevelMap.silent) {
        // Even when silent, surface a failed hook's captured output.
        if (!success) {
          if (stdout) console.log(stdout)
          if (stderr) console.error(stderr)
        }
        return
      }

      const active = state.activeHookLogs.get(id)
      if (!active) {
        return
      }
      state.activeHookLogs.delete(id)

      const commandWithArgs = formatCommandWithArgs(command, args)
      const duration = formatMsWithColor(getElapsedMs(active.hrStart))

      if (success) {
        active.taskLog.success(getMessage(`${styleText('dim', commandWithArgs)} completed in ${duration}`))
      } else {
        if (stdout) active.taskLog.message(stdout)
        if (stderr) active.taskLog.message(styleText('red', stderr))
        const reason = error?.message ? ` (${error.message})` : ''
        active.taskLog.error(getMessage(`${styleText('dim', commandWithArgs)} failed${reason}`), { showLog: true })
      }
    })

    context.on('kubb:lifecycle:end', () => {
      reset()
    })
  },
})
