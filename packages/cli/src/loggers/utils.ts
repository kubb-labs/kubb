import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { canUseTTY, formatHrtime, getElapsedMs, isGitHubActions, randomCliColor } from '@internals/utils'
import type { Config, Diagnostic, Logger, LoggerContext, LoggerOptions, Reporter, ReporterName } from '@kubb/core'
import { Diagnostics, getDiagnosticInfo, isPerformanceDiagnostic, logLevel as logLevelMap } from '@kubb/core'
import { SUMMARY_MAX_BAR_LENGTH, SUMMARY_TIME_SCALE_DIVISOR } from '../constants.ts'
import { fileReporter } from '../reporters/fileReporter.ts'
import { jsonReporter } from '../reporters/jsonReporter.ts'
import { clackLogger } from './clackLogger.ts'
import { githubActionsLogger } from './githubActionsLogger.ts'
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
 * Build the progress summary line shared by clack and GitHub Actions loggers.
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
 * Creates the per-run progress counters shared by the clack and GitHub Actions loggers.
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
 * Used by the loggers that key timing by hook `id` (GitHub Actions, plain).
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
  if (isGitHubActions()) {
    return 'github-actions'
  }
  if (canUseTTY()) {
    return 'clack'
  }
  return 'plain'
}

const logMapper: Record<LoggerType, CLILogger> = {
  clack: clackLogger,
  plain: plainLogger,
  'github-actions': githubActionsLogger,
}

/**
 * Bridges a {@link Reporter} onto the run's event emitter: accumulates diagnostics across
 * every config, then calls `report` once on `kubb:lifecycle:end`. The reporter never touches
 * the emitter.
 */
export function installReporter(context: LoggerContext, reporter: Reporter): void {
  const collected: Array<Diagnostic> = []

  context.on('kubb:generation:end', ({ diagnostics }) => {
    if (diagnostics) collected.push(...diagnostics)
  })

  context.on('kubb:lifecycle:end', async () => {
    await reporter.report(collected)
  })
}

/**
 * Installs the selected reporters and returns the terminal logger's hook sink, when one
 * was installed.
 *
 * The `json` reporter owns stdout, so the terminal (`cli`) reporter is suppressed whenever
 * `json` is selected, even if `cli` is also listed.
 */
export async function setupReporters(
  context: LoggerContext,
  { logLevel, reporters }: LoggerOptions & { reporters: ReadonlyArray<ReporterName> },
): Promise<HookSinkFactory | null> {
  const unique = new Set<ReporterName>(reporters.length ? reporters : ['cli'])
  const hasJson = unique.has('json')

  let makeSink: HookSinkFactory | null = null

  if (unique.has('cli') && !hasJson) {
    const type = detectLogger()
    const logger = logMapper[type]
    if (!logger) {
      throw new Error(`Unknown adapter type: ${type}`)
    }
    const sink = await logger.install(context, { logLevel })
    makeSink = typeof sink === 'function' ? sink : null
  }

  if (hasJson) {
    installReporter(context, jsonReporter)
  }

  if (unique.has('file')) {
    await fileReporter.install(context, { logLevel })
  }

  return makeSink
}

type SummaryProps = {
  /**
   * Diagnostics collected during the run. Failed plugin names and per-plugin timings
   * are derived from these.
   */
  diagnostics: Array<Diagnostic>
  /**
   * Overall generation status used to choose success or failure formatting.
   */
  status: 'success' | 'failed'
  /**
   * `process.hrtime()` snapshot taken at the start of generation, used to compute elapsed time.
   */
  hrStart: [number, number]
  /**
   * Total number of files written during this generation run.
   */
  filesCreated: number
  /**
   * Resolved Kubb config for this generation entry, used to read plugin count and output path.
   */
  config: Config
  /**
   * When true, append a per-plugin timing bar chart built from the `performance` diagnostics.
   */
  showTimings?: boolean
}

/**
 * Builds the generation summary lines rendered in the end-of-run box.
 * Returns an array of styled strings, one per summary row.
 */
export function getSummary({ diagnostics, filesCreated, status, hrStart, config, showTimings }: SummaryProps): Array<string> {
  const duration = formatHrtime(hrStart)

  const failedPluginNames = Diagnostics.failedPlugins(diagnostics)
  const pluginsCount = config.plugins?.length ?? 0
  const successCount = pluginsCount - failedPluginNames.length
  const timings = showTimings ? diagnostics.filter(isPerformanceDiagnostic) : []

  const meta = {
    plugins:
      status === 'success'
        ? `${styleText('green', `${successCount} successful`)}, ${pluginsCount} total`
        : `${styleText('green', `${successCount} successful`)}, ${styleText('red', `${failedPluginNames.length} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? failedPluginNames.map((name) => randomCliColor(name)).join(', ') : undefined,
    filesCreated,
    time: styleText('green', duration),
    output: path.resolve(config.root, config.output.path),
  } as const

  const labels = {
    plugins: 'Plugins:',
    failed: 'Failed:',
    issues: 'Issues:',
    generated: 'Generated:',
    pluginTimings: 'Plugin Timings:',
    output: 'Output:',
  }
  const maxLength = Math.max(0, ...[...Object.values(labels), ...timings.map((diagnostic) => diagnostic.plugin ?? '')].map((s) => s.length))

  const summaryLines: Array<string> = []
  summaryLines.push(`${labels.plugins.padEnd(maxLength + 2)} ${meta.plugins}`)

  if (meta.pluginsFailed) {
    summaryLines.push(`${labels.failed.padEnd(maxLength + 2)} ${meta.pluginsFailed}`)
  }

  // The only place problem counts surface: parse-time errors that aren't tied to a
  // failed plugin still show here, so the box agrees with the run's pass/fail.
  const { errors, warnings } = Diagnostics.count(diagnostics)
  if (errors > 0 || warnings > 0) {
    const issues = [
      errors > 0 ? styleText('red', `${errors} ${errors === 1 ? 'error' : 'errors'}`) : undefined,
      warnings > 0 ? styleText('yellow', `${warnings} ${warnings === 1 ? 'warning' : 'warnings'}`) : undefined,
    ]
      .filter(Boolean)
      .join(', ')
    summaryLines.push(`${labels.issues.padEnd(maxLength + 2)} ${issues}`)
  }

  summaryLines.push(`${labels.generated.padEnd(maxLength + 2)} ${meta.filesCreated} files in ${meta.time}`)

  if (timings.length > 0) {
    const sortedTimings = [...timings].sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))

    summaryLines.push(`${labels.pluginTimings}`)

    sortedTimings.forEach((diagnostic) => {
      const time = diagnostic.duration ?? 0
      const name = diagnostic.plugin ?? ''
      const timeStr = time >= 1000 ? `${(time / 1000).toFixed(2)}s` : `${Math.round(time)}ms`
      const barLength = Math.min(Math.ceil(time / SUMMARY_TIME_SCALE_DIVISOR), SUMMARY_MAX_BAR_LENGTH)
      const bar = styleText('dim', '█'.repeat(barLength))

      summaryLines.push(`${styleText('dim', '•')} ${name.padEnd(maxLength + 1)}${bar} ${timeStr}`)
    })
  }

  summaryLines.push(`${labels.output.padEnd(maxLength + 2)} ${meta.output}`)

  if (status === 'failed') {
    const env = getDiagnosticInfo()
    const rows: Array<[string, string]> = [
      ['node', env.nodeVersion],
      ['kubb', env.KubbVersion],
      ['platform', `${env.platform} ${env.arch}`],
      ['cwd', env.cwd],
    ]
    summaryLines.push(styleText('dim', 'Environment:'))
    for (const [name, value] of rows) {
      summaryLines.push(styleText('dim', `• ${name.padEnd(maxLength)} ${value}`))
    }
  }

  return summaryLines
}
