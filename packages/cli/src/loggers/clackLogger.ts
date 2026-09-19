import { relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import * as clack from '@clack/prompts'
import { getElapsedMs } from '@internals/utils'
import { Diagnostics, logLevel as logLevelMap } from '@kubb/core'
import { formatMsWithColor } from './banner.ts'
import type { Logger } from './defineLogger.ts'
import {
  buildProgressLine,
  createProgressCounters,
  formatCommandWithArgs,
  formatErrorFrames,
  formatMessage,
  formatVersions,
  getInputPath,
  pluralize,
  recordPluginResult,
  resetProgressCounters,
} from './utils.ts'

/**
 * An output phase (formatting, linting, post-generate hooks) while its spinner owns the line. The
 * lines it collects are printed under the phase's result, so nothing is drawn over.
 */
type Phase = {
  successLabel: string
  failureLabel: string
  /**
   * Whether each hook's own result is worth a line. A format or lint pass runs one command, so its
   * phase result already says everything; the post-generate phase runs several.
   */
  showHookResults: boolean
  /**
   * Set by the first error or failed hook inside the phase.
   */
  failed: boolean
  hrStart: [number, number]
  /**
   * Hook results collected while the phase's spinner held the line.
   */
  lines: Array<string>
  /**
   * Raw lines a hook printed. Rendered without clack's gutter bar, so a subprocess's own output
   * reads as its own block rather than as more of Kubb's tree.
   */
  output: Array<string>
}

/**
 * Drops the blank lines a subprocess leaves at either end of its output, so its block does not open
 * or close on an empty row.
 */
function trimBlankEdges(lines: ReadonlyArray<string>): Array<string> {
  const start = lines.findIndex((line) => line.trim())
  if (start === -1) {
    return []
  }

  return lines.slice(start, lines.findLastIndex((line) => line.trim()) + 1)
}

/**
 * TTY logger for local development. Renders one group per config: a generation spinner over the
 * plugin work, a progress bar for the writes, a spinner per output phase, then the summary and the
 * group's closing result.
 */
export const clackLogger = {
  name: 'clack',
  install(context, options) {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const state = {
      ...createProgressCounters(),
      spinner: clack.spinner(),
      isSpinning: false,
      activeProgress: new Map<string, { interval?: NodeJS.Timeout; progressBar: clack.ProgressResult }>(),
      activeHookLogs: new Map<string, { hrStart: [number, number]; lines: Array<string> }>(),
      /**
       * Plugin result lines held back while the generation spinner owns the line, flushed once it
       * stops so nothing overwrites them.
       */
      pluginLines: [] as Array<string>,
      /**
       * The output phase currently on the spinner, or `null` outside one. A phase owns the line
       * until it ends, so everything reported inside it is buffered rather than printed.
       */
      phase: null as Phase | null,
      /**
       * Whether a `clack.intro` is still waiting for its `clack.outro`.
       */
      groupOpen: false,
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
      state.activeHookLogs.clear()
      state.pluginLines = []
      state.phase = null
      state.groupOpen = false
    }

    function getMessage(message: string): string {
      return formatMessage(message, logLevel)
    }

    function startSpinner(text: string) {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      stopSpinner()
      state.spinner = clack.spinner()
      state.spinner.start(getMessage(text))
      state.isSpinning = true
    }

    function stopSpinner(text?: string) {
      if (!state.isSpinning) {
        return
      }
      state.spinner.stop(text)
      state.isSpinning = false
    }

    // Ends the spinner on its error symbol, so a failed phase never reads as finished.
    function failSpinner(text: string) {
      if (!state.isSpinning) {
        return
      }
      state.spinner.error(getMessage(text))
      state.isSpinning = false
    }

    type StartPhaseOptions = {
      running: string
      success: string
      failure: string
      showHookResults?: boolean
    }

    // Opens a phase spinner. The phase owns the line until `endPhase`, so everything reported in
    // between is buffered.
    function startPhase({ running, success, failure, showHookResults = false }: StartPhaseOptions) {
      state.phase = { successLabel: success, failureLabel: failure, showHookResults, failed: false, hrStart: process.hrtime(), lines: [], output: [] }
      startSpinner(running)
    }

    // Closes a phase with one result line, then whatever it collected.
    function endPhase() {
      const phase = state.phase
      state.phase = null

      if (!phase || logLevel <= logLevelMap.silent) {
        return
      }

      const duration = formatMsWithColor(getElapsedMs(phase.hrStart))

      if (phase.failed) {
        failSpinner(`${phase.failureLabel} after ${duration}`)
      } else {
        stopSpinner(getMessage(`${phase.successLabel} in ${duration}`))
      }

      if (phase.lines.length) {
        clack.log.message(phase.lines, { spacing: 0 })
      }

      const output = trimBlankEdges(phase.output)
      if (output.length) {
        clack.log.message(output, { symbol: '', secondarySymbol: '', spacing: 0 })
      }
    }

    // Writes the group's closing result, so an intro is never left without its outro. A run that
    // throws before `kubb:generation:end` (a failing setup, an abort) never reaches the summary,
    // so the lifecycle end closes the group instead.
    function closeGroup(status: 'success' | 'failed') {
      if (!state.groupOpen) {
        return
      }
      state.groupOpen = false

      stopSpinner()
      stopActiveProgress()
      clack.outro(status === 'failed' ? styleText('red', '✗ Generation failed') : styleText('green', '✓ Generation succeeded'))
    }

    function flushPluginLines() {
      if (!state.pluginLines.length) {
        return
      }

      clack.log.message(state.pluginLines, { spacing: 0 })
      state.pluginLines = []
    }

    context.hook('kubb:info', ({ message, info = '' }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage([styleText('blue', 'ℹ'), message, info ? styleText('dim', info) : undefined].filter(Boolean).join(' '))

      // A phase holds the line, so what it reports waits until the phase prints its result.
      // `kubb:info` carries something new (the auto-detected tool), so it is kept rather than
      // spent on a spinner frame that the next one overwrites.
      if (state.phase) {
        state.phase.lines.push(text)
        return
      }

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

      // A phase spinner outlives the successes reported inside it, so keep it spinning and let it
      // carry the latest one as its message.
      if (state.isSpinning) {
        state.spinner.message(text)
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
      if (state.phase) {
        state.phase.failed = true
      }

      const text = [styleText('red', '✗'), error.message].join(' ')

      if (state.isSpinning) {
        failSpinner(text)
      } else {
        clack.log.error(getMessage(text))
      }

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

    // A `kubb studio` session emits these on the same emitter as its generations, so one logger
    // renders the whole command. The socket opens without being awaited, hence the spinner.
    context.hook('studio:connecting', ({ url }) => {
      startSpinner(`Connecting to ${styleText('cyan', url)}`)
    })

    context.hook('studio:connected', ({ url, versions }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const text = getMessage(`Connected to ${styleText('cyan', url)} ${styleText('dim', `(${formatVersions(versions)})`)}`)

      if (state.isSpinning) {
        stopSpinner(text)
        return
      }
      clack.log.success(text)
    })

    context.hook('studio:ready', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      clack.log.success(getMessage('Ready to receive jobs'))
    })

    context.hook('studio:disconnected', ({ reason }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      stopSpinner()
      clack.log.warn(getMessage(`Kubb Studio ended the session (${reason})`))
    })

    context.hook('studio:command:start', ({ command }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      clack.log.info(getMessage(`Kubb Studio asked to ${styleText('bold', command)}`))
    })

    context.hook('studio:command:end', ({ command, info }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      clack.log.success(getMessage(`Finished ${command}${info ? ` ${styleText('dim', `(${info})`)}` : ''}`))
    })

    context.hook('studio:warn', ({ message }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      clack.log.warn(getMessage(message))
    })

    // Unguarded, like `kubb:error`: a failure stays visible even at silent.
    context.hook('studio:error', ({ error }) => {
      const text = [styleText('red', '✗'), error.message].join(' ')

      if (state.isSpinning) {
        failSpinner(text)
        return
      }
      clack.log.error(getMessage(text))
    })

    context.hook('kubb:lifecycle:start', () => {
      reset()
    })

    context.hook('kubb:generation:start', ({ config }) => {
      closeGroup('failed')
      reset()

      state.totalPlugins = config.plugins?.length ?? 0

      if (logLevel <= logLevelMap.silent) {
        return
      }

      const inputPath = getInputPath(config)

      clack.intro(getMessage([styleText('bold', config.name ?? 'kubb'), inputPath ? styleText('dim', inputPath) : undefined].filter(Boolean).join(' ')))
      state.groupOpen = true

      startSpinner('Generating')
    })

    context.hook('kubb:plugin:start', ({ plugin }) => {
      if (logLevel <= logLevelMap.silent || !state.isSpinning) {
        return
      }

      state.spinner.message(getMessage(`Generating ${styleText('dim', plugin.name)}`))
    })

    // A plugin's result is buffered, not printed: the generation spinner still owns the line, and
    // clack redraws over anything written while it spins.
    context.hook('kubb:plugin:end', ({ plugin, duration, success }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      recordPluginResult(state, success)
      state.pluginLines.push(getMessage(`${plugin.name} ${success ? 'completed' : 'failed'} in ${formatMsWithColor(duration)}`))
    })

    // A failed plugin is left to the group's closing result, so the group does not end early.
    context.hook('kubb:plugins:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const summary = buildProgressLine(state) ?? 'No plugins ran'

      if (state.failedPlugins > 0) {
        failSpinner(summary)
      } else {
        stopSpinner(getMessage(summary))
      }

      flushPluginLines()
    })

    context.hook('kubb:files:processing:start', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      stopSpinner()

      state.totalFiles = files.length
      state.processedFiles = 0

      const progressBar = clack.progress({
        style: 'block',
        max: files.length,
        size: 30,
      })

      progressBar.start(getMessage(`Writing ${pluralize(files.length, 'file')}`))
      state.activeProgress.set('files', { progressBar })
    })

    context.hook('kubb:files:processing:update', ({ files }) => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const active = state.activeProgress.get('files')
      for (const { file, config } of files) {
        state.processedFiles++
        active?.progressBar.advance(undefined, `Writing ${relative(config.root, file.path)}`)
      }
    })

    context.hook('kubb:files:processing:end', () => {
      if (logLevel <= logLevelMap.silent) {
        return
      }

      const active = state.activeProgress.get('files')
      if (!active) {
        return
      }

      active.progressBar.stop(getMessage(`Wrote ${pluralize(state.processedFiles, 'file')}`))
      state.activeProgress.delete('files')
    })

    context.hook('kubb:format:start', () => startPhase({ running: 'Formatting', success: 'Formatted', failure: 'Formatting failed' }))
    context.hook('kubb:format:end', endPhase)
    context.hook('kubb:lint:start', () => startPhase({ running: 'Linting', success: 'Linted', failure: 'Linting failed' }))
    context.hook('kubb:lint:end', endPhase)
    context.hook('kubb:hooks:start', () =>
      startPhase({
        running: 'Running post-generate hooks',
        success: 'Post-generate hooks completed',
        failure: 'Post-generate hooks failed',
        showHookResults: true,
      }),
    )
    context.hook('kubb:hooks:end', endPhase)

    context.hook('kubb:hook:start', ({ id }) => {
      if (logLevel <= logLevelMap.silent || !id) {
        return
      }

      state.activeHookLogs.set(id, { hrStart: process.hrtime(), lines: [] })
    })

    // Registered only when not silent, so its presence is what tells the runner to stream
    // (`kubb:hook:line` listenerCount). At silent level the listener is absent, so no streaming happens.
    if (logLevel > logLevelMap.silent) {
      context.hook('kubb:hook:line', ({ id, line }) => {
        const active = state.activeHookLogs.get(id)
        if (!active) {
          return
        }

        // A phase spinner redraws its own line, so its output waits until the phase ends.
        if (state.phase) {
          active.lines.push(line)
          return
        }

        clack.log.message(styleText('dim', line), { spacing: 0 })
      })
    }

    context.hook('kubb:hook:end', ({ id, command, name, args, success, error, stdout, stderr }) => {
      if (!id) {
        return
      }

      if (!success && state.phase) {
        state.phase.failed = true
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
      const label = styleText('dim', name ?? commandWithArgs)
      const reason = error?.message ? ` (${error.message})` : ''
      const result = success ? `${styleText('green', '✓')} ${label} in ${duration}` : `${styleText('red', '✗')} ${label} failed${reason}`

      const phase = state.phase
      if (phase) {
        if (phase.showHookResults || !success) {
          phase.lines.push(result)
        }
        phase.output.push(...active.lines)
        return
      }

      stopSpinner()
      clack.log.message(result, { spacing: 0 })

      const output = trimBlankEdges(active.lines)
      if (output.length) {
        clack.log.message(output, { symbol: '', secondarySymbol: '', spacing: 0 })
      }
    })

    context.hook('kubb:generation:end', () => {
      stopSpinner()
      stopActiveProgress()
    })

    context.hook('kubb:lifecycle:end', () => {
      closeGroup('failed')
      reset()
    })

    return {
      /**
       * Prints the summary inside the config's group, then closes that group with the run's result.
       */
      renderSummary(lines, { status }) {
        if (logLevel <= logLevelMap.silent || !state.groupOpen) {
          return
        }

        clack.log.message([...lines], { symbol: '', secondarySymbol: '' })
        closeGroup(status)
      },
    }
  },
} satisfies Logger
