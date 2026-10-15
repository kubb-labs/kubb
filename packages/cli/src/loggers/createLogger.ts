import { relative } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { formatMs, getElapsedMs } from '@internals/utils'
import type { Config } from '@kubb/core'
import { type Diagnostic, type DiagnosticFormatOptions, Diagnostics, logLevel as logLevelMap, type ProblemDiagnostic } from '@kubb/core'
import type { StudioConnectedContext } from '@kubb/studio'
import { formatMsWithColor } from './banner.ts'
import type { Logger, LoggerWriter, LogStatus, WriterProgress, WriterSpinner } from './defineLogger.ts'

/** Display path for a config's input: the string form, or its `path` field when the input is an object. */
function getInputPath(config: Config): string | undefined {
  const { input } = config
  if (typeof input === 'string') return input
  return typeof input?.path === 'string' ? input.path : undefined
}

/** Counts a noun, so a message never reads `1 files`. */
export function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`
}

/** Prefixes a `[HH:MM:SS]` timestamp at verbose and above. */
function formatMessage(message: string, logLevel: number): string {
  if (logLevel >= logLevelMap.verbose) {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return `${styleText('dim', `[${timestamp}]`)} ${message}`
  }
  return message
}

/**
 * Renders a `studio:connected` event's versions: the runtime only when it differs from the host.
 */
function formatVersions({ studio, kubb, agent }: StudioConnectedContext['versions']): string {
  return [`v${agent}`, kubb !== agent ? `runtime v${kubb}` : undefined, `Studio v${studio}`].filter(Boolean).join(', ')
}

type ProgressState = {
  totalPlugins: number
  completedPlugins: number
  failedPlugins: number
  totalFiles: number
  processedFiles: number
  /** `process.hrtime()` snapshot taken at the start of generation, for the elapsed time. */
  hrStart: [number, number]
}

/** The progress summary line the clack logger shows, `null` when there is nothing to display. */
function buildProgressLine(state: ProgressState): string | null {
  const parts: Array<string> = []
  const duration = formatMs(getElapsedMs(state.hrStart))

  if (state.totalPlugins > 0) {
    const pluginStr =
      state.failedPlugins > 0
        ? `Plugins ${styleText('green', state.completedPlugins.toString())}/${state.totalPlugins} ${styleText('red', `(${state.failedPlugins} failed)`)}`
        : `Plugins ${styleText('green', state.completedPlugins.toString())}/${state.totalPlugins}`
    parts.push(pluginStr)
  }

  if (state.totalFiles > 0) {
    parts.push(`Files ${styleText('green', state.processedFiles.toString())}/${state.totalFiles}`)
  }

  if (parts.length === 0) {
    return null
  }

  parts.push(`${styleText('green', duration)} elapsed`)
  return parts.join(styleText('dim', ' | '))
}

function createProgressCounters(): ProgressState {
  return {
    totalPlugins: 0,
    completedPlugins: 0,
    failedPlugins: 0,
    totalFiles: 0,
    processedFiles: 0,
    hrStart: process.hrtime(),
  }
}

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
 * export const plainLogger = createLogger(writer, { audience: 'agent' })
 * ```
 */
export function createLogger(writer: LoggerWriter, { audience }: { audience: DiagnosticFormatOptions['audience'] }): Logger {
  return function install(context, { logLevel }) {
    const silent = logLevel <= logLevelMap.silent
    const human = audience === 'human'
    const formatOptions: DiagnosticFormatOptions = {
      audience,
      verbose: logLevel >= logLevelMap.verbose,
      // The code lines up at the right edge, inside the two-column group indent.
      width: Math.min(process.stdout.columns || 80, 100) - 2,
    }
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
      /**
       * Whether this run keeps its files in memory, as a `kubb studio` run without `--allow-write` does.
       */
      inMemory: false,
      /**
       * Problems held back so the human view can print them grouped by plugin once the build ends.
       */
      problems: [] as Array<ProblemDiagnostic>,
      /**
       * The finished config's diagnostics and file count, for the closing summary.
       */
      outcome: null as { diagnostics: Array<Diagnostic>; filesCreated: number; hrStart: [number, number] } | null,
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
        spinner.clear()
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

    /** `✖ Failed  1 error · 1 warning  in plugin-ts` once the build ended, or `✗ Generation failed` for a run that stopped early. */
    function failedTitle(): string {
      const diagnostics = state.outcome?.diagnostics ?? []
      const counts = formatCounts(diagnostics)
      if (!human || !counts) {
        return '✗ Generation failed'
      }
      const plugins = Diagnostics.failedPlugins(diagnostics)
      return `✖ Failed  ${counts}${plugins.length ? `  in ${plugins.join(', ')}` : ''}`
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
      writer.groupEnd(status === 'failed' ? styleText('red', failedTitle()) : styleText('green', '✓ Generation succeeded'))
    }

    function reset() {
      stopSpinner()
      stopProgress()
      Object.assign(state, createProgressCounters())
      state.hooks.clear()
      state.pluginLines = []
      state.phase = null
      state.groupOpen = false
      state.problems = []
      state.outcome = null
    }

    /**
     * Prints problems grouped under their plugin's name, each with the code aligned at the right.
     */
    function writeProblems(problems: ReadonlyArray<ProblemDiagnostic>) {
      if (!problems.length) {
        return
      }
      if (!human) {
        for (const problem of problems) writer.diagnostic(Diagnostics.format(problem, formatOptions))
        return
      }

      const byPlugin = Map.groupBy(problems, (problem) => problem.plugin ?? '')
      const lines = [...byPlugin].flatMap(([plugin, group]) => [
        ...(plugin ? [` ${styleText('bold', plugin)}`, ''] : []),
        ...group.flatMap((problem) => [...Diagnostics.format(problem, formatOptions).map((line) => `  ${line}`), '']),
      ])
      writer.diagnostic(lines.slice(0, -1))
    }

    /** The run's verdict: `1 error · 1 warning` for a human, `1 error, 1 warning` for an agent. */
    function formatCounts(diagnostics: ReadonlyArray<Diagnostic>): string {
      const { errors, warnings } = Diagnostics.count(diagnostics)
      const parts = [errors && pluralize(errors, 'error'), warnings && pluralize(warnings, 'warning')].filter(Boolean)
      return parts.join(human ? ' · ' : ', ')
    }

    function formatLine(symbol: string, message: string, info?: string): string {
      return text([symbol, message, info && styleText('dim', info)].filter(Boolean).join(' '))
    }

    context.hook('kubb:warn', ({ message, info }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      writer.warn(formatLine(styleText('yellow', '⚠'), message, logLevel >= logLevelMap.info ? info : undefined))
    })

    // Unguarded: a failure stays visible even at silent.
    context.hook('kubb:error', ({ error }) => {
      if (state.phase) {
        state.phase.failed = true
      }

      // Rendered as a `KUBB_UNKNOWN` diagnostic, so the output alone says what broke and where. The
      // name tells a `TypeError` from a plain `Error`.
      const message = error.name === 'Error' || Diagnostics.isError(error) ? error.message : `${error.name}: ${error.message}`
      const help = Diagnostics.isError(error) ? error.diagnostic.help : undefined
      const [headline = '', ...details] = Diagnostics.format({ code: Diagnostics.code.unknown, severity: 'error', message, help, cause: error }, formatOptions)

      if (!human) {
        stopSpinner()
        stopProgress()
        writer.diagnostic([headline, ...details])
        return
      }

      // The writer draws the error symbol, so the message goes in bare.
      if (state.spinner) {
        stopSpinner(message, 'failed')
      } else {
        writer.error(text(message))
      }
      if (details.length) {
        writer.block(details.map(text))
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

      // Inside a build, the human view waits for the end to group by plugin.
      if (human && state.groupOpen) {
        state.problems.push(diagnostic)
        return
      }
      writeProblems([diagnostic])
    })

    // A `kubb studio` session emits these on the same emitter as its generations, so one logger
    // renders the whole command.
    context.hook('studio:disconnected', ({ code, reason }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }

      stopSpinner()
      // 4002 is `AgentCloseCode.SUPERSEDED`, spelled out because `@kubb/studio` is an optional peer.
      if (code === 4002) {
        writer.warn(text('⚠ Another process connected to Kubb Studio as this agent, so this one stopped'))
        return
      }
      writer.warn(text(`⚠ Kubb Studio ended the session (${reason || `code ${code}`})`))
    })

    context.hook('studio:warn', ({ message, permission }) => {
      if (logLevel < logLevelMap.warn) {
        return
      }
      const remedy = permission ? `; pass --${permission.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)} to allow it` : ''
      writer.warn(text(`⚠ ${message}${remedy}`))
    })

    // Unguarded, like `kubb:error`: a failure stays visible even at silent.
    context.hook('studio:error', ({ error }) => {
      if (state.spinner) {
        stopSpinner(error.message, 'failed')
        return
      }
      writer.error(text(error.message))
    })

    context.hook('kubb:lifecycle:start', () => {
      reset()
    })

    context.hook('kubb:generation:start', ({ config }) => {
      closeGroup('failed')
      reset()

      state.totalPlugins = config.plugins?.length ?? 0
      state.inMemory = config.storage?.name === 'memory'

      if (silent) {
        return
      }

      const inputPath = getInputPath(config)

      writer.group(text([styleText('bold', config.name ?? 'kubb'), inputPath ? styleText('dim', inputPath) : undefined].filter(Boolean).join(' ')))
      state.groupOpen = true

      startSpinner('Generating')
    })

    context.hook('kubb:format:start', () => startPhase(PHASES.format))
    context.hook('kubb:format:end', endPhase)
    context.hook('kubb:lint:start', () => startPhase(PHASES.lint))
    context.hook('kubb:lint:end', endPhase)
    context.hook('kubb:hooks:start', () => startPhase(PHASES.hooks))
    context.hook('kubb:hooks:end', endPhase)

    context.hook('kubb:hook:end', (ctx) => {
      const { id, command, name, args, success, error } = ctx
      if (!id) {
        return
      }

      if (!success && state.phase) {
        state.phase.failed = true
      }

      if (silent) {
        // Even when silent, surface a failed hook's captured output.
        if (!ctx.success) {
          if (ctx.stdout) console.log(ctx.stdout)
          if (ctx.stderr) console.error(ctx.stderr)
        }
        return
      }

      const active = state.hooks.get(id)
      if (!active) {
        return
      }
      state.hooks.delete(id)

      const label = styleText('dim', name ?? (args?.length ? `${command} ${args.join(' ')}` : command))
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

    context.hook('kubb:generation:end', ({ diagnostics = [], filesCreated = 0, hrStart = process.hrtime() }) => {
      stopSpinner()
      stopProgress()
      state.outcome = { diagnostics, filesCreated, hrStart }
      writeProblems(state.problems.splice(0))
    })

    context.hook('kubb:lifecycle:end', () => {
      writeProblems(state.problems.splice(0))
      closeGroup('failed')
      reset()
    })

    // Not registered at silent: the missing `kubb:hook:line` listener is also what tells the runner not to stream.
    if (!silent) {
      context.hook('kubb:info', ({ message, info }) => {
        const line = formatLine(styleText('blue', 'ℹ'), message, info)

        // Info carries something new (the auto-detected tool), so inside a phase it waits for the phase to print.
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
        const line = formatLine(styleText('green', '✓'), message, logLevel >= logLevelMap.info ? info : undefined)

        // The phase step's own result already reports these successes, so let the step carry them.
        if (state.spinner) {
          state.spinner.message(line)
          return
        }
        writer.success(line)
      })

      context.hook('studio:connected', ({ url, versions }) => {
        stopSpinner()
        writer.success(text(`✓ Connected to ${styleText('cyan', url)} ${styleText('dim', `(${formatVersions(versions)})`)}`))
        startSpinner('✓ Ready to receive jobs')
      })

      context.hook('studio:command', ({ command, info }) => {
        stopSpinner()
        writer.success(text(`✓ Finished ${command} ${styleText('dim', `(${info})`)}`))
        startSpinner('✓ Ready to receive jobs')
      })

      context.hook('studio:reconnecting', ({ delayMs }) => {
        stopSpinner()
        writer.info(text(styleText('dim', `Retrying connection to Kubb Studio in ${formatMs(delayMs)}`)))
      })

      context.hook('kubb:plugin:start', ({ plugin }) => {
        state.spinner?.message(text(`Generating ${styleText('dim', plugin.name)}`))
      })

      // Buffered, not printed: a step redraws over anything written while it runs.
      context.hook('kubb:plugin:end', ({ plugin, duration, success }) => {
        if (success) {
          state.completedPlugins++
        }
        if (!success) {
          state.failedPlugins++
        }
        state.pluginLines.push(text(`${plugin.name} ${success ? 'completed' : 'failed'} in ${formatMsWithColor(duration)}`))
      })

      context.hook('kubb:plugins:end', () => {
        const failed = state.failedPlugins > 0
        stopSpinner(buildProgressLine(state) ?? undefined, failed ? 'failed' : 'success')

        if (state.pluginLines.length) {
          writer.block(state.pluginLines)
          state.pluginLines = []
        }
      })

      context.hook('kubb:files:processing:start', ({ files }) => {
        stopSpinner()
        state.totalFiles = files.length
        state.processedFiles = 0

        state.progress = writer.progress(files.length)
        state.progress.start(text(`${state.inMemory ? 'Generating' : 'Writing'} ${pluralize(files.length, 'file')}`))
      })

      context.hook('kubb:files:processing:update', ({ files }) => {
        for (const { file, config } of files) {
          state.processedFiles++
          state.progress?.advance(`${state.inMemory ? 'Generating' : 'Writing'} ${relative(config.root, file.path)}`)
        }
      })

      context.hook('kubb:files:processing:end', () => {
        stopProgress(state.inMemory ? `Generated ${pluralize(state.processedFiles, 'file')} in memory` : `Wrote ${pluralize(state.processedFiles, 'file')}`)
      })

      context.hook('kubb:hook:start', ({ id }) => {
        if (!id) {
          return
        }
        state.hooks.set(id, { hrStart: process.hrtime(), lines: [] })
      })

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

    return {
      renderSummary(lines, { status }) {
        if (silent || !state.groupOpen) {
          return
        }

        if (human) {
          closeGroup(status)
          writer.diagnostic([...lines])
          return
        }

        // The verdict below replaces the group's closing line.
        stopSpinner()
        stopProgress()
        state.groupOpen = false

        // An agent gets one verdict line instead of the aligned table, and on failure where to get more.
        const { diagnostics = [], filesCreated = 0, hrStart = process.hrtime() } = state.outcome ?? {}
        if (status === 'failed') {
          const plugins = Diagnostics.failedPlugins(diagnostics)
          writer.diagnostic([
            `Kubb failed: ${formatCounts(diagnostics) || 'an error'}${plugins.length ? ` (${plugins.join(', ')})` : ''}. Exit code 1.`,
            'Rerun with --reporter json for machine-readable diagnostics.',
          ])
          return
        }
        const warnings = formatCounts(diagnostics)
        writer.diagnostic([
          `Kubb succeeded: ${pluralize(filesCreated, 'file')} generated in ${formatMs(getElapsedMs(hrStart))}${warnings ? `, ${warnings}` : ''}.`,
        ])
      },
    }
  }
}
