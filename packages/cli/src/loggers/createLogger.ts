import { relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { getElapsedMs } from '@internals/utils'
import { Diagnostics, logLevel as logLevelMap } from '@kubb/core'
import { formatMsWithColor } from './banner.ts'
import type { LoggerContext, LoggerHandle, LoggerOptions, LoggerWriter, LogStatus, WriterProgress, WriterSpinner } from './defineLogger.ts'
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
 * One output phase while its step owns the line. A phase buffers what it is told, because a spinner
 * redraws over anything written under it, and prints the lot once it knows its own result.
 */
type Phase = {
  successLabel: string
  failureLabel: string
  /**
   * Whether each hook's own result is worth a line. Format and lint run one command, so the phase
   * result already says everything; the post-generate phase runs several.
   */
  showHookResults: boolean
  failed: boolean
  hrStart: [number, number]
  lines: Array<string>
  /**
   * Raw lines a hook printed, drawn outside the group.
   */
  output: Array<string>
}

type StartPhaseOptions = {
  /**
   * Shown while the phase runs.
   */
  running: string
  success: string
  failure: string
  showHookResults?: boolean
}

/**
 * The three output phases, in the order the generate runner runs them.
 */
const PHASES = {
  format: { running: 'Formatting', success: 'Formatted', failure: 'Formatting failed' },
  lint: { running: 'Linting', success: 'Linted', failure: 'Linting failed' },
  hooks: {
    running: 'Running post-generate hooks',
    success: 'Post-generate hooks completed',
    failure: 'Post-generate hooks failed',
    showHookResults: true,
  },
} as const satisfies Record<string, StartPhaseOptions>

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
 * Wires a {@link LoggerWriter} onto the run's hooks. This owns what a run says and in what order:
 * one group per config, a step over the plugin work, a progress bar for the writes, one step per
 * output phase, then the summary and the group's closing result. The writer only decides how each
 * line looks, so every logger reports the same run the same way.
 *
 * @example
 * ```ts
 * export const plainLogger = { name: 'plain', install: (context, options) => createLogger(writer)(context, options) }
 * ```
 */
export function createLogger(writer: LoggerWriter) {
  return function install(context: LoggerContext, options?: LoggerOptions): LoggerHandle {
    const logLevel = options?.logLevel ?? logLevelMap.info
    const silent = logLevel <= logLevelMap.silent
    const state = {
      ...createProgressCounters(),
      spinner: null as WriterSpinner | null,
      progress: null as WriterProgress | null,
      hooks: new Map<string, { hrStart: [number, number]; lines: Array<string> }>(),
      /**
       * Plugin results held back while the generation step owns the line.
       */
      pluginLines: [] as Array<string>,
      phase: null as Phase | null,
      groupOpen: false,
    }

    function text(message: string): string {
      return formatMessage(message, logLevel)
    }

    function startSpinner(message: string) {
      if (silent) {
        return
      }

      state.spinner = writer.spinner()
      state.spinner.start(text(message))
    }

    function stopSpinner(message?: string, status: LogStatus = 'success') {
      const spinner = state.spinner
      if (!spinner) {
        return
      }
      state.spinner = null

      if (message === undefined) {
        spinner.stop('')
        return
      }
      if (status === 'failed') {
        spinner.error(text(message))
        return
      }
      spinner.stop(text(message))
    }

    function stopProgress(message?: string) {
      const progress = state.progress
      if (!progress) {
        return
      }
      state.progress = null
      progress.stop(message === undefined ? '' : text(message))
    }

    function startPhase({ running, success, failure, showHookResults = false }: StartPhaseOptions) {
      state.phase = { successLabel: success, failureLabel: failure, showHookResults, failed: false, hrStart: process.hrtime(), lines: [], output: [] }
      startSpinner(running)
    }

    function endPhase() {
      const phase = state.phase
      state.phase = null

      if (!phase || silent) {
        return
      }

      const duration = formatMsWithColor(getElapsedMs(phase.hrStart))

      stopSpinner(phase.failed ? `${phase.failureLabel} after ${duration}` : `${phase.successLabel} in ${duration}`, phase.failed ? 'failed' : 'success')

      if (phase.lines.length) {
        writer.block(phase.lines)
      }
      writeOutput(phase.output)
    }

    function writeOutput(lines: ReadonlyArray<string>) {
      const output = trimBlankEdges(lines)
      if (output.length) {
        writer.raw(output)
      }
    }

    // A run that throws before `kubb:generation:end` never reaches the summary, so the lifecycle
    // end calls this too rather than leave a group without its closing line.
    function closeGroup(status: LogStatus) {
      if (!state.groupOpen) {
        return
      }
      state.groupOpen = false

      stopSpinner()
      stopProgress()
      writer.groupEnd(status === 'failed' ? styleText('red', '✗ Generation failed') : styleText('green', '✓ Generation succeeded'), status)
    }

    function reset() {
      stopSpinner()
      stopProgress()
      resetProgressCounters(state)
      state.hooks.clear()
      state.pluginLines = []
      state.phase = null
      state.groupOpen = false
    }

    context.hook('kubb:info', ({ message, info }) => {
      if (silent) {
        return
      }

      const line = text([styleText('blue', 'ℹ'), message, info ? styleText('dim', info) : undefined].filter(Boolean).join(' '))

      // Info carries something new (the auto-detected tool), so inside a phase it waits for the
      // phase to print rather than being spent on a frame the next one overwrites.
      if (state.phase) {
        state.phase.lines.push(line)
        return
      }
      if (state.spinner) {
        state.spinner.message(line)
        return
      }
      writer.info(line)
    })

    context.hook('kubb:success', ({ message, info }) => {
      if (silent) {
        return
      }

      const line = text([styleText('green', '✓'), message, logLevel >= logLevelMap.info && info ? styleText('dim', info) : undefined].filter(Boolean).join(' '))

      // A phase step outlives the successes reported inside it, and its own result says the same
      // thing, so let the step carry them.
      if (state.spinner) {
        state.spinner.message(line)
        return
      }
      writer.success(line)
    })

    context.hook('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      writer.warn(
        text([styleText('yellow', '⚠'), message, logLevel >= logLevelMap.info && info ? styleText('dim', info) : undefined].filter(Boolean).join(' ')),
      )
    })

    // Unguarded: a failure stays visible even at silent.
    context.hook('kubb:error', ({ error }) => {
      if (state.phase) {
        state.phase.failed = true
      }

      const line = [styleText('red', '✗'), error.message].join(' ')

      if (state.spinner) {
        stopSpinner(line, 'failed')
      } else {
        writer.error(text(line))
      }

      const frames = logLevel >= logLevelMap.verbose ? formatErrorFrames(error) : null
      if (!frames) {
        return
      }

      writer.block(frames.frames.map((frame) => text(styleText('dim', frame))))
      if (frames.cause) {
        writer.block([styleText('dim', frames.cause.header), ...frames.cause.frames.map((frame) => text(`    ${styleText('dim', frame)}`))])
      }
    })

    context.hook('kubb:diagnostic', ({ diagnostic }) => {
      // Silent still surfaces errors so failures stay visible. It drops warnings and info.
      if (silent && diagnostic.severity !== 'error') {
        return
      }

      stopSpinner()
      stopProgress()

      if (Diagnostics.isUpdate(diagnostic)) {
        writer.update(
          [`\`v${diagnostic.currentVersion}\` → \`v${diagnostic.latestVersion}\``, 'Run `npm install -g @kubb/cli` to update'],
          'Update available for `Kubb`',
        )
        return
      }

      const { headline, details } = Diagnostics.format(diagnostic)
      writer.diagnostic([headline, ...details])
    })

    // A `kubb studio` session emits these on the same emitter as its generations, so one logger
    // renders the whole command. The socket opens without being awaited, hence the step.
    context.hook('studio:connecting', ({ url }) => {
      startSpinner(`Connecting to ${styleText('cyan', url)}`)
    })

    context.hook('studio:connected', ({ url, versions }) => {
      if (silent) {
        return
      }

      const line = `Connected to ${styleText('cyan', url)} ${styleText('dim', `(${formatVersions(versions)})`)}`

      if (state.spinner) {
        stopSpinner(line)
        return
      }
      writer.success(text(`✓ ${line}`))
    })

    context.hook('studio:ready', () => {
      if (silent) {
        return
      }
      writer.success(text('✓ Ready to receive jobs'))
    })

    context.hook('studio:disconnected', ({ reason }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      stopSpinner()
      writer.warn(text(`⚠ Kubb Studio ended the session (${reason})`))
    })

    context.hook('studio:command:start', ({ command }) => {
      if (silent) {
        return
      }
      writer.info(text(`Kubb Studio asked to ${styleText('bold', command)}`))
    })

    context.hook('studio:command:end', ({ command, info }) => {
      if (silent) {
        return
      }
      writer.success(text(`✓ Finished ${command}${info ? ` ${styleText('dim', `(${info})`)}` : ''}`))
    })

    context.hook('studio:warn', ({ message }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }
      writer.warn(text(`⚠ ${message}`))
    })

    // Unguarded, like `kubb:error`: a failure stays visible even at silent.
    context.hook('studio:error', ({ error }) => {
      const line = `✗ ${error.message}`

      if (state.spinner) {
        stopSpinner(line, 'failed')
        return
      }
      writer.error(text(line))
    })

    context.hook('kubb:lifecycle:start', () => {
      reset()
    })

    context.hook('kubb:generation:start', ({ config }) => {
      closeGroup('failed')
      reset()

      state.totalPlugins = config.plugins?.length ?? 0

      if (silent) {
        return
      }

      const inputPath = getInputPath(config)

      writer.group(text([styleText('bold', config.name ?? 'kubb'), inputPath ? styleText('dim', inputPath) : undefined].filter(Boolean).join(' ')))
      state.groupOpen = true

      startSpinner('Generating')
    })

    context.hook('kubb:plugin:start', ({ plugin }) => {
      if (silent) {
        return
      }
      state.spinner?.message(text(`Generating ${styleText('dim', plugin.name)}`))
    })

    // Buffered, not printed: a step redraws over anything written while it runs.
    context.hook('kubb:plugin:end', ({ plugin, duration, success }) => {
      if (silent) {
        return
      }

      recordPluginResult(state, success)
      state.pluginLines.push(text(`${plugin.name} ${success ? 'completed' : 'failed'} in ${formatMsWithColor(duration)}`))
    })

    context.hook('kubb:plugins:end', () => {
      if (silent) {
        return
      }

      const failed = state.failedPlugins > 0
      stopSpinner(buildProgressLine(state) ?? 'No plugins ran', failed ? 'failed' : 'success')

      if (state.pluginLines.length) {
        writer.block(state.pluginLines)
        state.pluginLines = []
      }
    })

    context.hook('kubb:files:processing:start', ({ files }) => {
      if (silent) {
        return
      }

      stopSpinner()
      state.totalFiles = files.length
      state.processedFiles = 0

      state.progress = writer.progress(files.length)
      state.progress.start(text(`Writing ${pluralize(files.length, 'file')}`))
    })

    context.hook('kubb:files:processing:update', ({ files }) => {
      if (silent) {
        return
      }

      for (const { file, config } of files) {
        state.processedFiles++
        state.progress?.advance(`Writing ${relative(config.root, file.path)}`)
      }
    })

    context.hook('kubb:files:processing:end', () => {
      if (silent) {
        return
      }
      stopProgress(`Wrote ${pluralize(state.processedFiles, 'file')}`)
    })

    context.hook('kubb:format:start', () => startPhase(PHASES.format))
    context.hook('kubb:format:end', endPhase)
    context.hook('kubb:lint:start', () => startPhase(PHASES.lint))
    context.hook('kubb:lint:end', endPhase)
    context.hook('kubb:hooks:start', () => startPhase(PHASES.hooks))
    context.hook('kubb:hooks:end', endPhase)

    context.hook('kubb:hook:start', ({ id }) => {
      if (silent || !id) {
        return
      }
      state.hooks.set(id, { hrStart: process.hrtime(), lines: [] })
    })

    // Registered only when not silent, so its presence is what tells the runner to stream
    // (`kubb:hook:line` listenerCount). At silent level the listener is absent, so no streaming happens.
    if (!silent) {
      context.hook('kubb:hook:line', ({ id, line }) => {
        const active = state.hooks.get(id)
        if (!active) {
          return
        }

        // A phase step redraws its own line, so its output waits until the phase ends.
        if (state.phase) {
          active.lines.push(line)
          return
        }
        writer.raw([line])
      })
    }

    context.hook('kubb:hook:end', ({ id, command, name, args, success, error, stdout, stderr }) => {
      if (!id) {
        return
      }

      if (!success && state.phase) {
        state.phase.failed = true
      }

      if (silent) {
        // Even when silent, surface a failed hook's captured output.
        if (!success) {
          if (stdout) console.log(stdout)
          if (stderr) console.error(stderr)
        }
        return
      }

      const active = state.hooks.get(id)
      if (!active) {
        return
      }
      state.hooks.delete(id)

      const label = styleText('dim', name ?? formatCommandWithArgs(command, args))
      const reason = error?.message ? ` (${error.message})` : ''
      const result = success
        ? `${styleText('green', '✓')} ${label} in ${formatMsWithColor(getElapsedMs(active.hrStart))}`
        : `${styleText('red', '✗')} ${label} failed${reason}`

      const phase = state.phase
      if (phase) {
        if (phase.showHookResults || !success) {
          phase.lines.push(result)
        }
        phase.output.push(...active.lines)
        return
      }

      stopSpinner()
      writer.step(text(result))
      writeOutput(active.lines)
    })

    context.hook('kubb:generation:end', () => {
      stopSpinner()
      stopProgress()
    })

    context.hook('kubb:lifecycle:end', () => {
      closeGroup('failed')
      reset()
    })

    return {
      renderSummary(lines, { status }) {
        if (silent || !state.groupOpen) {
          return
        }

        writer.diagnostic([...lines])
        closeGroup(status)
      },
    }
  }
}
