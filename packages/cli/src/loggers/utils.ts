import process from 'node:process'
import { styleText } from 'node:util'
import { canUseTTY, formatHrtime, getElapsedMs } from '@internals/utils'
import type { Reporter, ReporterContext } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import type { Logger, LoggerContext, LoggerOptions } from './defineLogger.ts'
import { clackLogger } from './clackLogger.ts'
import { plainLogger } from './plainLogger.ts'
import type { LoggerType } from './types.ts'

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
 *
 * @example
 * `formatCommandWithArgs('prettier', ['--write', '.']) → 'prettier --write .'`
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

const logMapper: Record<LoggerType, Logger> = {
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
 * Installs the live logger (the TUI view) and the given reporters (the output). The reporters are
 * already selected by the caller (the CLI maps `--reporter` to names via `selectReporters`). This
 * only wires them. Loggers receive hook subprocess output through `kubb:hook:line` and the
 * `stdout`/`stderr` on `kubb:hook:end`, so nothing is returned here.
 *
 * Loggers and reporters are independent: the `cli` reporter also activates the env logger summary.
 * The `json` reporter owns stdout, so the live logger and the `cli` summary are suppressed whenever
 * `json` is among the reporters, even if `cli` is also listed.
 */
async function setupReporters(context: LoggerContext, { logLevel, reporters }: LoggerOptions & { reporters: ReadonlyArray<Reporter> }): Promise<void> {
  const hasJson = reporters.some((reporter) => reporter.name === 'json')
  const ctx: ReporterContext = { logLevel }

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
      await logger.install(context, { logLevel })
    }

    installReporter(context, reporter, ctx)
  }
}

export default setupReporters

/**
 * Picks the reporters whose `name` matches one of `names`, in the order the names are given.
 * The config carries every available reporter, and the host selects which to activate by name
 * (the CLI maps `--reporter` to this). Duplicate names and names without a matching reporter are
 * skipped.
 */
export function selectReporters(reporters: ReadonlyArray<Reporter>, names: ReadonlyArray<string>): Array<Reporter> {
  const seen = new Set<string>()
  const selected: Array<Reporter> = []

  for (const name of names) {
    if (seen.has(name)) {
      continue
    }
    seen.add(name)

    const reporter = reporters.find((candidate) => candidate.name === name)
    if (reporter) {
      selected.push(reporter)
    }
  }

  return selected
}
