import { relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { formatMsWithColor, getElapsedMs, getIntro } from '@internals/utils'
import { Diagnostics, logLevel as logLevelMap } from '@kubb/core'
import type { Logger } from './defineLogger.ts'
import {
  buildProgressLine,
  createLogHelpers,
  createProgressCounters,
  formatCommandWithArgs,
  formatErrorFrames,
  recordPluginResult,
  resetProgressCounters,
} from './utils.ts'

/**
 * TTY logger for local development, with spinners and progress bars.
 */
export const clackLogger = {
  name: 'clack',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const { getMessage, onStep } = createLogHelpers({ context, logLevel, print: (text) => clack.log.step(text) })
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

    function stopSpinner(text?: string) {
      if (!state.isSpinning) {
        return
      }
      state.spinner.stop(text)
      state.isSpinning = false
    }

    context.hook('kubb:info', ({ message, info = '' }) => {
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

    context.hook('kubb:success', ({ message, info = '' }) => {
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

    context.hook('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      const text = getMessage(
        [styleText('yellow', '⚠'), message, logLevel >= logLevelMap.info && info ? styleText('dim', info) : undefined].filter(Boolean).join(' '),
      )

      clack.log.warn(text)
    })

    context.hook('kubb:error', ({ error }) => {
      const text = [styleText('red', '✗'), error.message].join(' ')

      if (state.isSpinning) {
        stopSpinner(getMessage(text))
        return
      }
      clack.log.error(getMessage(text))

      const frames = logLevel >= logLevelMap.verbose ? formatErrorFrames(error) : null
      if (frames) {
        for (const frame of frames.frames) {
          clack.log.message(getMessage(styleText('dim', frame)))
        }

        if (frames.cause) {
          clack.log.message(styleText('dim', frames.cause.header))

          for (const frame of frames.cause.frames) {
            clack.log.message(getMessage(`    ${styleText('dim', frame)}`))
          }
        }
      }
    })

    context.hook('kubb:diagnostic', ({ diagnostic }) => {
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

      // The diagnostic carries the code and its own indented detail rows, so clear clack's
      // gutter and bar (`symbol`/`secondarySymbol`) and let the block stand on its own.
      const { headline, details } = Diagnostics.format(diagnostic)
      clack.log.message([headline, ...details], { symbol: '', secondarySymbol: '' })
    })

    context.hook('kubb:lifecycle:start', async ({ version }) => {
      console.log(`\n${getIntro({ title: 'The meta framework for code generation', description: 'Ready to start', version, areEyesOpen: true })}\n`)

      reset()
    })

    context.hook('kubb:generation:start', ({ config }) => {
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
    context.hook('kubb:plugin:start', ({ plugin }) => {
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

    context.hook('kubb:plugin:end', ({ plugin, success }) => {
      stopSpinner()

      const active = state.activeProgress.get('plugins')

      if (!active || logLevel <= logLevelMap.silent) {
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

    context.hook('kubb:files:processing:start', ({ files }) => {
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

      context.callHook('kubb:info', { message: text })
      progressBar.start(getMessage(text))
      state.activeProgress.set('files', { progressBar })
    })

    context.hook('kubb:files:processing:update', ({ files }) => {
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
    context.hook('kubb:files:processing:end', () => {
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

    context.hook('kubb:generation:end', ({ config }) => {
      stopSpinner()

      const text = getMessage(config.name ? `Generation completed for ${styleText('dim', config.name)}` : 'Generation completed')

      clack.outro(text)
    })

    onStep('kubb:format:start', 'Formatting')
    onStep('kubb:lint:start', 'Linting')
    onStep('kubb:hooks:start', 'Running hooks')

    context.hook('kubb:hook:start', ({ id, command, name, args }) => {
      if (logLevel <= logLevelMap.silent || !id) {
        return
      }

      stopSpinner()

      const commandWithArgs = formatCommandWithArgs(command, args)
      const title = getMessage(`Running ${styleText('dim', name ?? commandWithArgs)}`)
      const taskLog = clack.taskLog({ title })

      state.activeHookLogs.set(id, { taskLog, hrStart: process.hrtime() })
    })

    // Registered only when not silent, so its presence is what tells the runner to stream
    // (`kubb:hook:line` listenerCount). At silent level the listener is absent, so no streaming happens.
    if (logLevel > logLevelMap.silent) {
      context.hook('kubb:hook:line', ({ id, line }) => {
        const active = state.activeHookLogs.get(id)
        active?.taskLog.message(styleText('dim', line))
      })
    }

    context.hook('kubb:hook:end', ({ id, command, name, args, success, error, stdout, stderr }) => {
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
        active.taskLog.success(getMessage(`${styleText('dim', name ?? commandWithArgs)} completed in ${duration}`))
      } else {
        // The hook's output already reached the taskLog live via `kubb:hook:line`, so `showLog`
        // replays it here. `kubb:hook:end` carries no captured output on the streaming path.
        const reason = error?.message ? ` (${error.message})` : ''
        active.taskLog.error(getMessage(`${styleText('dim', name ?? commandWithArgs)} failed${reason}`), { showLog: true })
      }
    })

    context.hook('kubb:lifecycle:end', () => {
      reset()
    })
  },
} satisfies Logger
