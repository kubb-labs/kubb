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

/**
 * Flatten an error into a headline plus the `cause`/`AggregateError` chain so logs explain *why*
 * something failed instead of stopping at the outermost message. Guards against cyclic causes.
 */
function describeError(error: unknown): { message: string; stack?: string; chain: Array<string> } {
  const chain: Array<string> = []
  const seen = new Set<unknown>()
  let current: unknown = error

  while (current && !seen.has(current)) {
    seen.add(current)

    if (current instanceof AggregateError) {
      for (const inner of current.errors) {
        chain.push(inner instanceof Error ? `${inner.name}: ${inner.message}` : String(inner))
      }
    } else if (current instanceof Error) {
      chain.push(`${current.name}: ${current.message}`)
    } else {
      chain.push(String(current))
    }

    current = current instanceof Error ? current.cause : undefined
  }

  const top = error instanceof Error ? error : undefined

  return { message: top?.message ?? String(error), stack: top?.stack, chain }
}

/**
 * Log a thrown value at error level with its stack and unwound cause chain, turning an opaque
 * `[unhandledRejection] Generation failed` into the underlying plugin/error detail.
 */
function logException(tag: string, error: unknown, ctx?: LogContext) {
  const { message, stack, chain } = describeError(error)
  const cause = chain.length > 1 ? chain.slice(1).join(' <- ') : undefined

  console.error(`[${tag}] ${message}`)
  if (cause) {
    console.error(`[${tag}] caused by: ${cause}`)
  }
  if (stack) {
    console.error(stack)
  }

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
  exception: (tag: string, error: unknown, ctx?: LogContext) => logException(tag, error, ctx),
}
