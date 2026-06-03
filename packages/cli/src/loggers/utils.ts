import process from 'node:process'
import { styleText } from 'node:util'
import { canUseTTY, formatHrtime, getElapsedMs } from '@internals/utils'
import type { Logger, LoggerContext, LoggerOptions, Reporter, ReporterContext } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import { clackLogger } from './clackLogger.ts'
import { plainLogger } from './plainLogger.ts'
import type { LoggerType } from './types.ts'

/**
 * Output sink for a hook subprocess, controlling how streamed lines and exit output are forwarded.
 */
type HookOutputSink = {
  /**
   * Called for each streamed stdout line while the hook runs.
   */
  onLine?: (line: string) => void
  /**
   * Called with stderr content after the hook exits with a non-zero code.
   */
  onStderr?: (text: string) => void
  /**
   * Called with stdout content after the hook exits with a non-zero code.
   */
  onStdout?: (text: string) => void
}

/**
 * Output sink combined with stream control for a hook subprocess.
 */
export type HookSinkOptions = HookOutputSink & {
  /**
   * When `true`, streams process output line-by-line via `onLine`.
   *
   * @default false
   */
  stream?: boolean
}

/**
 * Factory called once per hook command to build the output sink and streaming flag.
 * The function should set up any logger UI (e.g., spinner) and return callbacks that forward subprocess output to it.
 *
 * `hookId` is the same id passed to `kubb:hook:start` / `kubb:hook:end`, letting the logger
 * correlate streamed output with the active UI element (e.g., a clack `taskLog`) it created in the start handler.
 */
export type HookSinkFactory = (commandWithArgs: string, hookId: string) => HookSinkOptions | null

/**
 * Logger variant that may return a {@link HookSinkFactory} from `install`.
 * The factory is forwarded to hook execution so the logger controls subprocess output routing.
 */
type CLILogger = Logger<LoggerOptions, HookSinkFactory | undefined | null>

/**
 * Optionally prefix a message with a [HH:MM:SS] timestamp when logLevel >= verbose.
 * Shared across all logger adapters to avoid duplication.
 */
export function formatMessage(message: string, logLevel: number): string {
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

type ProgressState = {
  /**
   * Total number of plugins scheduled for this generation run.
   */
  totalPlugins: number
  /**
   * Number of plugins that have finished without error.
   */
  completedPlugins: number
  /**
   * Number of plugins that exited with an error.
   */
  failedPlugins: number
  /**
   * Total number of files expected to be written.
   */
  totalFiles: number
  /**
   * Number of files written so far.
   */
  processedFiles: number
  /**
   * `process.hrtime()` snapshot taken at the start of generation, used to compute elapsed time.
   */
  hrStart: [number, number]
}

/**
 * Build the progress summary line shown by the clack logger.
 * Returns null when there is nothing to display.
 */
export function buildProgressLine(state: ProgressState): string | null {
  const parts: Array<string> = []
  const duration = formatHrtime(state.hrStart)

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

/**
 * Creates the per-run progress counters used by the clack logger.
 */
export function createProgressCounters(): ProgressState {
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
 * Resets the progress counters in place at the start/end of a generation run.
 */
export function resetProgressCounters(state: ProgressState): void {
  state.totalPlugins = 0
  state.completedPlugins = 0
  state.failedPlugins = 0
  state.totalFiles = 0
  state.processedFiles = 0
  state.hrStart = process.hrtime()
}

/**
 * Records a finished plugin against the progress counters.
 */
export function recordPluginResult(state: ProgressState, success: boolean): void {
  if (success) {
    state.completedPlugins++
  } else {
    state.failedPlugins++
  }
}

/**
 * Tracks per-hook start times so a logger can report a hook's elapsed duration.
 * Used by the plain logger, which keys timing by hook `id`.
 */
export type HookTimer = {
  start(id: string): void
  /**
   * Returns the elapsed milliseconds since `start(id)`, or `undefined` when no start was recorded.
   */
  end(id: string): number | undefined
  clear(): void
}

/**
 * Creates a {@link HookTimer} backed by a private `id → hrtime` map.
 */
export function createHookTimer(): HookTimer {
  const starts = new Map<string, [number, number]>()

  return {
    start(id: string): void {
      starts.set(id, process.hrtime())
    },
    end(id: string): number | undefined {
      const hrStart = starts.get(id)
      if (!hrStart) {
        return undefined
      }
      starts.delete(id)
      return getElapsedMs(hrStart)
    },
    clear(): void {
      starts.clear()
    },
  }
}

/**
 * Join a command and its optional args into a single display string.
 * e.g. ("prettier", ["--write", "."]) → "prettier --write ."
 */
export function formatCommandWithArgs(command: string, args?: ReadonlyArray<string>): string {
  return args?.length ? `${command} ${args.join(' ')}` : command
}

function detectLogger(): LoggerType {
  if (canUseTTY()) {
    return 'clack'
  }
  return 'plain'
}

const logMapper: Record<LoggerType, CLILogger> = {
  clack: clackLogger,
  plain: plainLogger,
}

/**
 * Bridges a {@link Reporter} onto the run's event emitter: calls `report` with each config's
 * {@link GenerationResult} on `kubb:generation:end`. The reporter never touches the emitter.
 */
export function installReporter(context: LoggerContext, reporter: Reporter, ctx: ReporterContext): void {
  context.on('kubb:generation:end', async ({ config, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
    await reporter.report({ config, diagnostics, filesCreated, status, hrStart }, ctx)
  })

  if (reporter.drain) {
    context.on('kubb:lifecycle:end', () => reporter.drain?.(ctx))
  }
}

/**
 * Installs the live logger (the TUI view) and the given reporters (the output), returning the
 * terminal logger's hook sink when one was installed. The reporters are already selected by the
 * caller (the CLI maps `--reporter` to names via `selectReporters`); this only wires them.
 *
 * Loggers and reporters are independent: the `cli` reporter also activates the env logger summary.
 * The `json` reporter owns stdout, so the live logger and the `cli` summary are suppressed whenever
 * `json` is among the reporters, even if `cli` is also listed.
 */
async function setupReporters(
  context: LoggerContext,
  { logLevel, reporters }: LoggerOptions & { reporters: ReadonlyArray<Reporter> },
): Promise<HookSinkFactory | null> {
  const hasJson = reporters.some((reporter) => reporter.name === 'json')
  const ctx: ReporterContext = { logLevel }

  let makeSink: HookSinkFactory | null = null

  for (const reporter of reporters) {
    if (reporter.name === 'cli') {
      if (hasJson) {
        continue
      }
      const type = detectLogger()
      const logger = logMapper[type]
      if (!logger) {
        throw new Error(`Unknown adapter type: ${type}`)
      }
      const sink = await logger.install(context, { logLevel })
      makeSink = typeof sink === 'function' ? sink : null
    }

    installReporter(context, reporter, ctx)
  }

  return makeSink
}

export default setupReporters
