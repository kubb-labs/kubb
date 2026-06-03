import process from 'node:process'
import { styleText } from 'node:util'
import { getElapsedMs, isGitHubActions } from '@internals/utils'
import type { LoggerContext, LoggerOptions, Reporter, ReporterContext, ReporterName } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import { cliReporter } from '../reporters/cliReporter.ts'
import { fileReporter } from '../reporters/fileReporter.ts'
import { jsonReporter } from '../reporters/jsonReporter.ts'
import { installGitHubAnnotations } from './githubAnnotations.ts'
import { logger } from './logger.ts'

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
 * The function should set up any logger UI and return callbacks that forward subprocess output to it.
 *
 * `hookId` is the same id passed to `kubb:hook:start` / `kubb:hook:end`, letting the logger
 * correlate streamed output with any active UI element it created in the start handler.
 */
export type HookSinkFactory = (commandWithArgs: string, hookId: string) => HookSinkOptions | null

/**
 * Optionally prefix a message with a [HH:MM:SS] timestamp when logLevel >= verbose.
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

/**
 * Tracks per-hook start times so a logger can report a hook's elapsed duration.
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
      if (!hrStart) return undefined
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

/**
 * Bridges a {@link Reporter} onto the run's event emitter: calls `report` with each config's
 * {@link GenerationResult} on `kubb:generation:end`. The reporter never touches the emitter.
 */
export function installReporter(context: LoggerContext, reporter: Reporter, ctx: ReporterContext): void {
  context.on('kubb:generation:end', async ({ config, diagnostics = [], filesCreated = 0, status = 'success', hrStart = process.hrtime() }) => {
    await reporter.report({ config, diagnostics, filesCreated, status, hrStart }, ctx)
  })

  if (reporter.flush) {
    context.on('kubb:lifecycle:end', () => reporter.flush?.(ctx))
  }
}

/**
 * Installs the unified consola-backed logger and the selected reporters, returning its hook sink
 * factory. The GitHub Actions annotation decorator is installed before the logger when the runtime
 * is detected, so `::group::` and friends wrap each section. The `json` reporter owns stdout, so
 * the logger and `cli` summary are suppressed whenever `json` is selected, even if `cli` is also listed.
 */
export async function setupReporters(
  context: LoggerContext,
  { logLevel, reporters }: LoggerOptions & { reporters: ReadonlyArray<ReporterName> },
): Promise<HookSinkFactory | null> {
  const unique = new Set<ReporterName>(reporters.length ? reporters : ['cli'])
  const hasJson = unique.has('json')
  const ctx: ReporterContext = { logLevel }

  let makeSink: HookSinkFactory | null = null

  if (unique.has('cli') && !hasJson) {
    if (isGitHubActions()) {
      installGitHubAnnotations(context, { logLevel })
    }
    const sink = await logger.install(context, { logLevel })
    makeSink = typeof sink === 'function' ? sink : null
    installReporter(context, cliReporter, ctx)
  }

  if (hasJson) {
    // json aggregates across configs: report buffers each result and flush writes one array on
    // lifecycle end, rather than printing per config (which would concatenate documents and break `jq .`).
    installReporter(context, jsonReporter, ctx)
  }

  if (unique.has('file')) {
    installReporter(context, fileReporter, ctx)
  }

  return makeSink
}
