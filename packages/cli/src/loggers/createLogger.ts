import { styleText } from 'node:util'
import type { Config, DiagnosticFormatOptions } from '@kubb/core'
import { logLevel as logLevelMap } from '@kubb/core'
import { createLoggerContext, provideLogger } from './composables/context.ts'
import { useGeneration } from './composables/useGeneration.ts'
import { usePhases } from './composables/usePhases.ts'
import { useProblems } from './composables/useProblems.ts'
import { useProgress } from './composables/useProgress.ts'
import { useSession } from './composables/useSession.ts'
import { useSpinner } from './composables/useSpinner.ts'
import { useWalk } from './composables/useWalk.ts'
import type { Logger, LoggerWriter } from './defineLogger.ts'

/** `HH:MM:SS` in 24-hour time. */
function clock(date = new Date()): string {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** Display path for a config's input: the string form, or its `path` field when the input is an object. */
export function getInputPath(config: Config): string | undefined {
  const { input } = config
  if (typeof input === 'string') return input
  return typeof input?.path === 'string' ? input.path : undefined
}

/** Counts a noun, so a message never reads `1 files`. */
export function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`
}

/** The flag that grants a permission, such as `--allow-read-ast`. */
export function toPermissionFlag(key: string): string {
  return `--${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`
}

/** Prefixes a `[HH:MM:SS]` timestamp at verbose and above. */
function formatMessage(message: string, logLevel: number): string {
  if (logLevel >= logLevelMap.verbose) {
    return `${styleText('dim', `[${clock()}]`)} ${message}`
  }
  return message
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
  const time = clock(date)
  const by = requestedBy ? `${styleText('dim', `by ${requestedBy}`.padEnd(16))} ` : ''

  return `${styleText('dim', time)}  ${command.padEnd(10)} ${by}${result}`
}

/**
 * Wires a {@link LoggerWriter} onto the run's hooks. This owns what a run says and in what order:
 * one group per config, a step over the plugin work, a progress bar for the writes, one step per
 * output phase, then the summary and the group's closing result. The writer only decides how each
 * line looks, so every logger reports the same run the same way.
 *
 * Each feature is a composable under `./composables/`, which registers its own hooks on first use.
 *
 * @example
 * ```ts
 * export const plainLogger = createLogger(writer, { audience: 'agent' })
 * ```
 */
export function createLogger(writer: LoggerWriter, { audience }: { audience: DiagnosticFormatOptions['audience'] }): Logger {
  return function install(hooks, { logLevel }) {
    const ctx = createLoggerContext({
      hooks,
      writer,
      logLevel,
      silent: logLevel <= logLevelMap.silent,
      audience,
      text: (message) => formatMessage(message, logLevel),
    })

    return provideLogger(ctx, () => {
      useSpinner()
      useProgress()
      useWalk()
      usePhases()
      useProblems()
      useSession()
      const { renderSummary } = useGeneration()

      return { renderSummary: (lines, options) => provideLogger(ctx, () => renderSummary(lines, options)) }
    })
  }
}
