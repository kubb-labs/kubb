type LogContext = Record<string, string | number | boolean | null | undefined>
type LogLevel = 'info' | 'success' | 'warn' | 'error'

function filterContext(ctx?: LogContext): Record<string, unknown> | undefined {
  if (!ctx) return undefined
  const filtered = Object.fromEntries(Object.entries(ctx).filter(([, v]) => v !== undefined && v !== null))

  return Object.keys(filtered).length ? (filtered as Record<string, unknown>) : undefined
}

function log(level: LogLevel, tag: string, message?: string, ctx?: LogContext) {
  const displayMessage = message !== undefined ? `[${tag}] ${message}` : tag
  console[level === 'success' ? 'log' : level](displayMessage)

  const filtered = filterContext(ctx)
  if (filtered) {
    console.table(filtered)
  }
}

export const logger = {
  info: (tag: string, message?: string, ctx?: LogContext) => log('info', tag, message, ctx),
  success: (tag: string, message?: string, ctx?: LogContext) => log('success', tag, message, ctx),
  warn: (tag: string, message?: string, ctx?: LogContext) => log('warn', tag, message, ctx),
  error: (tag: string, message?: string, ctx?: LogContext) => log('error', tag, message, ctx),
  // `console.error` unwinds `cause` and `AggregateError.errors` itself, so the value is passed
  // through rather than flattened by hand.
  exception: (tag: string, error: unknown) => console.error(`[${tag}]`, error),
}
