import { logLevel as logLevels } from '@kubb/core'

type LogContext = Record<string, string | number | boolean | null | undefined>
type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

/**
 * Verbosity the host asked for. Module state rather than a parameter: it is fixed for the life of
 * the process, and threading it through thirty call sites would buy nothing.
 */
let threshold: number = logLevels.info

/**
 * Sets how much the client prints. Package-internal on purpose: `createClient` takes a level, which
 * is data, rather than a logger, which would make logging part of the public surface.
 */
export function setLogLevel(level: 'silent' | 'info' | 'verbose' = 'info'): void {
  threshold = logLevels[level] ?? logLevels.info
}

/**
 * Errors sit below `silent` so they always print, matching what the CLI's own loggers do: silent
 * drops progress and warnings, never failures.
 */
const minimumLevel = {
  debug: logLevels.verbose,
  info: logLevels.info,
  success: logLevels.info,
  warn: logLevels.warn,
  error: Number.NEGATIVE_INFINITY,
} satisfies Record<LogLevel, number>

function filterContext(ctx?: LogContext): Record<string, unknown> | undefined {
  if (!ctx) return undefined
  const filtered = Object.fromEntries(Object.entries(ctx).filter(([, v]) => v !== undefined && v !== null))

  return Object.keys(filtered).length ? (filtered as Record<string, unknown>) : undefined
}

function log(level: LogLevel, tag: string, message?: string, ctx?: LogContext) {
  if (threshold < minimumLevel[level]) {
    return
  }

  const displayMessage = message !== undefined ? `[${tag}] ${message}` : tag
  console[level === 'success' ? 'log' : level](displayMessage)

  const filtered = filterContext(ctx)
  if (filtered) {
    console.table(filtered)
  }
}

export const logger = {
  debug: (tag: string, message?: string, ctx?: LogContext) => log('debug', tag, message, ctx),
  info: (tag: string, message?: string, ctx?: LogContext) => log('info', tag, message, ctx),
  success: (tag: string, message?: string, ctx?: LogContext) => log('success', tag, message, ctx),
  warn: (tag: string, message?: string, ctx?: LogContext) => log('warn', tag, message, ctx),
  error: (tag: string, message?: string, ctx?: LogContext) => log('error', tag, message, ctx),
  // `console.error` unwinds `cause` and `AggregateError.errors` itself, so the value is passed
  // through rather than flattened by hand.
  exception: (tag: string, error: unknown) => console.error(`[${tag}]`, error),
}

/**
 * Masks a secret for logs, keeping only enough of it to tell two values apart.
 */
export function maskString(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 8)}…${value.slice(-4)}`
}

/**
 * Waits using the global timer so fake-timer test setups stay in control — `node:timers/promises`
 * is not affected by them.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
