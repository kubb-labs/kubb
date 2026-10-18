import { relative, resolve } from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { formatMs, getElapsedMs } from '@internals/utils'
import type { Config, KubbHooks } from '@kubb/core'
import { type Diagnostic, type DiagnosticFormatOptions, Diagnostics, getInputKind, logLevel as logLevelMap, type ProblemDiagnostic } from '@kubb/core'
import type { StudioConnectedContext } from '@kubb/studio'
import { formatBar, formatMsWithColor } from './banner.ts'
import type { Logger, LoggerWriter, LogStatus, WriterProgress, WriterSpinner } from './defineLogger.ts'
import { loadSpecLocator, type SpecLocator } from './specFrame.ts'

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
  return [`v${agent}`, kubb !== agent ? `runtime v${kubb}` : undefined, `Studio v${studio}`].filter(Boolean).join(' · ')
}

/** One line of a Studio session's job log: the time, the command, who asked for it, and how it ended. */
export function formatJobLine({
  command,
  result,
  requestedBy,
  date = new Date(),
}: {
  command: string
  result: string
  requestedBy?: string
  date?: Date
}): string {
  const time = date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  // A long name is cut so the results stay in one column.
  const name = requestedBy && requestedBy.length > 12 ? `${requestedBy.slice(0, 11).trimEnd()}…` : requestedBy
  const by = name ? `${styleText('dim', `by ${name}`.padEnd(16))} ` : ''

  return `${styleText('dim', time)}  ${command.padEnd(10)} ${by}${result}`
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

/** The node walk's live state: the spec's node total, the distinct nodes generated, and each plugin's count and current node. */
function createWalk() {
  return { total: 0, visited: new Set<string>(), plugins: new Map<string, { count: number; current: string }>() }
}

/** Milliseconds between redraws of the live generation block, about clack's spinner frame rate. */
const WALK_REDRAW_MS = 80

/** A hook's display name: its `name`, or the command line it runs. */
function formatHookLabel({ command, name, args }: { command: string; name?: string; args?: ReadonlyArray<string> }): string {
  return name ?? (args?.length ? `${command} ${args.join(' ')}` : command)
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
      // The code lines up at the right edge, inside the group indent and the human view's per-problem indent.
      width: Math.min(process.stdout.columns || 80, 100) - (audience === 'human' ? 4 : 2),
    }
    const state = {
      ...createProgressCounters(),
      spinner: null as WriterSpinner | null,
      /** The message the running spinner started with, so a paused spinner can resume as it was. */
      spinnerMessage: '',
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
      walk: createWalk(),
      pluginStarted: false,
      /**
       * The finished config's diagnostics and file count, for the closing summary.
       */
      outcome: null as { diagnostics: Array<Diagnostic>; filesCreated: number; hrStart: [number, number] } | null,
      /**
       * Absolute path of a local-file input, which a located diagnostic points into.
       */
      specPath: undefined as string | undefined,
      /**
       * The parsed input, read once on the first located diagnostic of a build.
       */
      spec: null as Promise<SpecLocator | undefined> | null,
      lastWalkDraw: 0,
      /** Set once a rich `kubb studio` session connects: each run then shows as one job line. */
      session: false,
    }

    function text(message: string): string {
      return formatMessage(message, logLevel)
    }

    // In a Studio session the job line stands for the whole run, so the per-run hooks stay quiet.
    const onRun = ((name: string, fn: (...args: Array<unknown>) => unknown) =>
      context.hook(name as keyof KubbHooks, (...args: Array<unknown>) => (state.session ? undefined : fn(...args)))) as typeof context.hook

    function startSpinner(message: string) {
      if (silent) {
        return
      }

      state.spinner = writer.spinner()
      state.spinnerMessage = message
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
      state.walk = createWalk()
      state.pluginStarted = false
      state.outcome = null
      state.specPath = undefined
      state.spec = null
      state.lastWalkDraw = 0
    }

    /** Format options for one problem, with its line and column in a local spec when its pointer resolves there. */
    async function optionsFor(problem: ProblemDiagnostic): Promise<DiagnosticFormatOptions> {
      const location = problem.location
      const specPath = state.specPath
      if (!location || !('pointer' in location) || !specPath) {
        return formatOptions
      }

      state.spec ??= loadSpecLocator(specPath)
      const position = (await state.spec)?.({ pointer: location.pointer, ref: 'ref' in location ? location.ref : undefined })
      if (!position) {
        return formatOptions
      }
      return { ...formatOptions, position: { file: relative(process.cwd(), specPath), ...position } }
    }

    /**
     * Prints problems grouped under their plugin's name, each with the code aligned at the right.
     */
    async function writeProblems(problems: ReadonlyArray<ProblemDiagnostic>) {
      if (!problems.length) {
        return
      }
      const formatted = await Promise.all(problems.map(async (problem) => Diagnostics.format(problem, await optionsFor(problem))))
      if (!human) {
        for (const lines of formatted) writer.diagnostic(lines)
        return
      }

      const byPlugin = Map.groupBy(
        problems.map((problem, index) => ({ plugin: problem.plugin ?? '', lines: formatted[index]! })),
        ({ plugin }) => plugin,
      )
      const lines = [...byPlugin].flatMap(([plugin, group]) => [
        ...(plugin ? [` ${styleText('bold', plugin)}`, ''] : []),
        ...group.flatMap((entry) => [...entry.lines.map((line) => `  ${line}`), '']),
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

    context.hook('kubb:diagnostic', async ({ diagnostic }) => {
      // Silent still surfaces errors so failures stay visible. It drops warnings and info.
      if (silent && diagnostic.severity !== 'error') {
        return
      }
      // A Studio job's problems show in Studio; its job line counts the errors.
      if (state.session && !Diagnostics.isUpdate(diagnostic)) {
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
      await writeProblems([diagnostic])
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
      // A warning drawn under a running spinner leaves a stale spinner frame above it, so it pauses the spinner like a job line does.
      const paused = state.spinner ? state.spinnerMessage : undefined
      stopSpinner()
      writer.warn(text(`⚠ ${message}${remedy}`))
      if (paused !== undefined) startSpinner(paused)
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

    onRun('kubb:generation:start', ({ config }) => {
      closeGroup('failed')
      reset()

      state.totalPlugins = config.plugins?.length ?? 0
      state.inMemory = config.storage?.name === 'memory'
      const input = getInputPath(config)
      state.specPath = input && getInputKind(input) === 'file' ? resolve(config.root, input) : undefined

      if (silent) {
        return
      }

      const inputPath = getInputPath(config)

      writer.group(text([styleText('bold', config.name ?? 'kubb'), inputPath ? styleText('dim', inputPath) : undefined].filter(Boolean).join(' ')))
      state.groupOpen = true

      startSpinner('Parsing spec')
    })

    onRun('kubb:format:start', () => startPhase(PHASES.format))
    onRun('kubb:format:end', endPhase)
    onRun('kubb:lint:start', () => startPhase(PHASES.lint))
    onRun('kubb:lint:end', endPhase)
    onRun('kubb:hooks:start', () => startPhase(PHASES.hooks))
    onRun('kubb:hooks:end', endPhase)

    onRun('kubb:hook:end', (ctx) => {
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

      const label = styleText('dim', formatHookLabel({ command, name, args }))
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

    onRun('kubb:generation:end', async ({ diagnostics = [], filesCreated = 0, hrStart = process.hrtime() }) => {
      stopSpinner()
      stopProgress()
      state.outcome = { diagnostics, filesCreated, hrStart }
      await writeProblems(state.problems.splice(0))
    })

    context.hook('kubb:lifecycle:end', async () => {
      await writeProblems(state.problems.splice(0))
      closeGroup('failed')
      reset()
    })

    // Not registered at silent: the missing `kubb:hook:line` listener is also what tells the runner not to stream.
    if (!silent) {
      onRun('kubb:info', ({ message, info }) => {
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

      onRun('kubb:success', ({ message, info }) => {
        const line = formatLine(styleText('green', '✓'), message, logLevel >= logLevelMap.info ? info : undefined)

        // The phase step's own result already reports these successes, so let the step carry them.
        if (state.spinner) {
          state.spinner.message(line)
          return
        }
        writer.success(line)
      })

      // The last generation's outcome, for the job line `studio:command` prints after it.
      let job: { fileCount: number; ms: number; errors: number } | null = null

      context.hook('studio:connected', ({ url, versions }) => {
        state.session = human
        stopSpinner()
        writer.success(text(`✓ Connected to ${styleText('cyan', url)} ${styleText('dim', `· ${formatVersions(versions)}`)}`))
        startSpinner('Ready for jobs')
      })

      context.hook('kubb:generation:start', () => {
        if (state.session) state.spinner?.message(text('Generating'))
      })

      context.hook('kubb:generation:end', ({ diagnostics = [], filesCreated = 0, status, hrStart = process.hrtime() }) => {
        job = { fileCount: filesCreated, ms: getElapsedMs(hrStart), errors: status === 'failed' ? Diagnostics.count(diagnostics).errors : 0 }
      })

      context.hook('studio:command', ({ command, info, requestedBy, failed }) => {
        stopSpinner()
        const took = command === 'generate' && job ? `${pluralize(job.fileCount, 'file')} in ${formatMs(job.ms)} ` : ''
        const result = failed
          ? `${styleText('red', '✖')} ${job?.errors ? pluralize(job.errors, 'error') : 'failed'}, see Studio`
          : `${styleText('green', '✓')} ${took}${styleText('dim', `(${info})`)}`
        writer.info(formatJobLine({ command, requestedBy, result }))
        job = null
        startSpinner('Ready for jobs')
      })

      context.hook('studio:reconnecting', ({ delayMs }) => {
        stopSpinner()
        writer.info(text(styleText('dim', `Retrying connection to Kubb Studio in ${formatMs(delayMs)}`)))
      })

      // Every plugin starts before the shared walk, so only the first is named; the per-node hooks take over from there.
      onRun('kubb:plugin:start', ({ plugin }) => {
        if (state.pluginStarted) return
        state.pluginStarted = true
        state.spinner?.message(text(`Generating ${styleText('dim', plugin.name)}`))
      })

      onRun('kubb:build:start', ({ nodeCounts: { schemas, operations } }) => {
        state.walk.total = schemas + operations
        const details = `${pluralize(schemas, 'schema')} · ${pluralize(operations, 'operation')} · ${formatMs(getElapsedMs(state.hrStart))}`
        stopSpinner(`Parsed spec  ${styleText('dim', details)}`)
        startSpinner('Generating')
      })

      // Plugins all end after one shared node walk, so per-node hooks keep the step live; plain output would get a line per node.
      if (human) {
        const onNode = (key: string, name: string, plugin: string) => {
          const { total, visited, plugins } = state.walk
          visited.add(key)
          plugins.set(plugin, { count: (plugins.get(plugin)?.count ?? 0) + 1, current: name })

          // Counting stays per node; the redraw waits for the spinner's next frame.
          const now = Date.now()
          if (now - state.lastWalkDraw < WALK_REDRAW_MS) return
          state.lastWalkDraw = now

          const elapsed = styleText('dim', formatMs(getElapsedMs(state.hrStart)))
          const head = total
            ? `Generating  ${formatBar([
                [visited.size, 'magenta'],
                [total - visited.size, 'dim'],
              ])}  ${visited.size}/${total} nodes  ${elapsed}`
            : `Generating  ${pluralize(visited.size, 'node')}  ${elapsed}`
          const width = Math.max(...[...plugins.keys()].map((pluginName) => pluginName.length))
          const rows = [...plugins].map(
            ([pluginName, row]) =>
              `${styleText('dim', '│')}   ${pluginName.padEnd(width)}  ${styleText('dim', String(row.count).padStart(4))}  ${styleText('cyan', row.current)}`,
          )
          state.spinner?.message(text([head, ...rows].join('\n')))
        }

        onRun('kubb:generate:schema', (node, { plugin }) => onNode(`schema:${node.name}`, node.name ?? 'schema', plugin.name))
        onRun('kubb:generate:operation', (node, { plugin }) => onNode(`operation:${node.operationId}`, node.operationId, plugin.name))
      }

      // Buffered, not printed: a step redraws over anything written while it runs.
      onRun('kubb:plugin:end', ({ plugin, duration, success }) => {
        if (success) {
          state.completedPlugins++
        }
        if (!success) {
          state.failedPlugins++
        }
        state.pluginLines.push(text(`${plugin.name} ${success ? 'completed' : 'failed'} in ${formatMsWithColor(duration)}`))
      })

      onRun('kubb:plugins:end', () => {
        const failed = state.failedPlugins > 0
        stopSpinner(buildProgressLine(state) ?? undefined, failed ? 'failed' : 'success')

        if (state.pluginLines.length) {
          writer.block(state.pluginLines)
          state.pluginLines = []
        }
      })

      onRun('kubb:files:processing:start', ({ files }) => {
        stopSpinner()
        state.totalFiles = files.length
        state.processedFiles = 0

        state.progress = writer.progress(files.length)
        state.progress.start(text(`${state.inMemory ? 'Generating' : 'Writing'} ${pluralize(files.length, 'file')}`))
      })

      onRun('kubb:files:processing:update', ({ files }) => {
        for (const { file, config } of files) {
          state.processedFiles++
          state.progress?.advance(`${state.inMemory ? 'Generating' : 'Writing'} ${relative(config.root, file.path)}`)
        }
      })

      onRun('kubb:files:processing:end', ({ files, unchanged }) => {
        const skipped = unchanged.length ? styleText('dim', ` · ${unchanged.length} unchanged`) : ''
        stopProgress(
          state.inMemory
            ? `Generated ${pluralize(state.processedFiles, 'file')} in memory`
            : `Wrote ${pluralize(files.length - unchanged.length, 'file')}${skipped}`,
        )
      })

      onRun('kubb:hook:start', ({ id, command, name, args }) => {
        if (!id) {
          return
        }
        state.hooks.set(id, { hrStart: process.hrtime(), lines: [] })
        state.spinner?.message(text(`Running ${styleText('dim', formatHookLabel({ command, name, args }))}`))
      })

      onRun('kubb:hook:line', ({ id, line }) => {
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
