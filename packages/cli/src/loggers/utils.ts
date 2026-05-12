import path from 'node:path'
import { styleText } from 'node:util'
import { canUseTTY, formatHrtime, isGitHubActions, randomCliColor } from '@internals/utils'
import type { Config, Logger, LoggerContext, LoggerOptions, Plugin } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import { SUMMARY_MAX_BAR_LENGTH, SUMMARY_TIME_SCALE_DIVISOR } from '../constants.ts'
import type { HookSinkOptions } from '../utils.ts'
import { clackLogger } from './clackLogger.ts'
import { fileSystemLogger } from './fileSystemLogger.ts'
import { githubActionsLogger } from './githubActionsLogger.ts'
import { plainLogger } from './plainLogger.ts'
import type { LoggerType } from './types.ts'

/**
 * Factory called once per hook command to build the output sink and streaming flag.
 * The function should set up any logger UI (e.g., spinner) and return callbacks that forward subprocess output to it.
 */
export type HookSinkFactory = (commandWithArgs: string) => HookSinkOptions | undefined

/**
 * Logger variant that may return a {@link HookSinkFactory} from `install`.
 * The factory is forwarded to hook execution so the logger controls subprocess output routing.
 */
export type CLILogger = Logger<LoggerOptions, HookSinkFactory | void>

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
  const parts: string[] = []
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
 * Join a command and its optional args into a single display string.
 * e.g. ("prettier", ["--write", "."]) → "prettier --write ."
 */
export function formatCommandWithArgs(command: string, args?: readonly string[]): string {
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

export async function setupLogger(context: LoggerContext, { logLevel }: LoggerOptions): Promise<HookSinkFactory | undefined> {
  const type = detectLogger()

  const logger = logMapper[type]

  if (!logger) {
    throw new Error(`Unknown adapter type: ${type}`)
  }

  const makeSink = await logger.install(context, { logLevel })

  if (logLevel >= logLevelMap.debug) {
    await fileSystemLogger.install(context, { logLevel })
  }

  return typeof makeSink === 'function' ? makeSink : undefined
}

type SummaryProps = {
  /**
   * Set of plugins that failed during this generation run, each with its error.
   */
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
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
   * Per-plugin timing map (plugin name → duration in ms). When provided, a timing bar chart is appended.
   */
  pluginTimings?: Map<string, number>
}

/**
 * Builds the generation summary lines rendered in the end-of-run box.
 * Returns an array of styled strings, one per summary row.
 */
export function getSummary({ failedPlugins, filesCreated, status, hrStart, config, pluginTimings }: SummaryProps): string[] {
  const duration = formatHrtime(hrStart)

  const pluginsCount = config.plugins?.length ?? 0
  const successCount = pluginsCount - failedPlugins.size

  const meta = {
    plugins:
      status === 'success'
        ? `${styleText('green', `${successCount} successful`)}, ${pluginsCount} total`
        : `${styleText('green', `${successCount} successful`)}, ${styleText('red', `${failedPlugins.size} failed`)}, ${pluginsCount} total`,
    pluginsFailed: status === 'failed' ? [...failedPlugins].map(({ plugin }) => randomCliColor(plugin.name)).join(', ') : undefined,
    filesCreated,
    time: styleText('green', duration),
    output: path.resolve(config.root, config.output.path),
  } as const

  const labels = {
    plugins: 'Plugins:',
    failed: 'Failed:',
    generated: 'Generated:',
    pluginTimings: 'Plugin Timings:',
    output: 'Output:',
  }
  const maxLength = Math.max(0, ...[...Object.values(labels), ...(pluginTimings ? Array.from(pluginTimings.keys()) : [])].map((s) => s.length))

  const summaryLines: string[] = []
  summaryLines.push(`${labels.plugins.padEnd(maxLength + 2)} ${meta.plugins}`)

  if (meta.pluginsFailed) {
    summaryLines.push(`${labels.failed.padEnd(maxLength + 2)} ${meta.pluginsFailed}`)
  }

  summaryLines.push(`${labels.generated.padEnd(maxLength + 2)} ${meta.filesCreated} files in ${meta.time}`)

  if (pluginTimings && pluginTimings.size > 0) {
    const sortedTimings = Array.from(pluginTimings.entries()).sort((a, b) => b[1] - a[1])

    summaryLines.push(`${labels.pluginTimings}`)

    sortedTimings.forEach(([name, time]) => {
      const timeStr = time >= 1000 ? `${(time / 1000).toFixed(2)}s` : `${Math.round(time)}ms`
      const barLength = Math.min(Math.ceil(time / SUMMARY_TIME_SCALE_DIVISOR), SUMMARY_MAX_BAR_LENGTH)
      const bar = styleText('dim', '█'.repeat(barLength))

      summaryLines.push(`${styleText('dim', '•')} ${name.padEnd(maxLength + 1)}${bar} ${timeStr}`)
    })
  }

  summaryLines.push(`${labels.output.padEnd(maxLength + 2)} ${meta.output}`)

  return summaryLines
}
