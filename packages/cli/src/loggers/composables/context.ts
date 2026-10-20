import { styleText } from 'node:util'
import type { DiagnosticFormatOptions, Hookable, KubbHooks } from '@kubb/core'
import type { LoggerWriter } from '../defineLogger.ts'

/**
 * What one `install` shares with its composables. One CLI process has one logger listening, so the
 * context lives at module level while `install` and its hooks run, and each `useX()` memoizes its
 * state in `features`.
 */
export type LoggerContext = {
  writer: LoggerWriter
  logLevel: number
  silent: boolean
  audience: DiagnosticFormatOptions['audience']
  human: boolean
  /** Set once a rich `kubb studio` session connects: each run then shows as one job line. */
  session: boolean
  /** Prefixes a `[HH:MM:SS]` timestamp at verbose and above. */
  text: (message: string) => string
  /** Registers a hook whose listener runs with this context, so `useX()` works inside it. */
  hook: <Name extends keyof KubbHooks & string>(name: Name, fn: (...args: KubbHooks[Name]) => unknown) => () => void
  /** Like `hook`, for a per-run hook. In a Studio session the job line stands for the whole run, so these stay quiet. */
  onRun: <Name extends keyof KubbHooks & string>(name: Name, fn: (...args: KubbHooks[Name]) => unknown) => () => void
  features: Map<string, unknown>
}

let current: LoggerContext | null = null

/** Makes `ctx` the logger context while `fn` runs. `install` is synchronous, so no async store is needed. */
export function provideLogger<T>(ctx: LoggerContext, fn: () => T): T {
  const previous = current
  current = ctx
  try {
    return fn()
  } finally {
    current = previous
  }
}

/** The context of the running `install`, or of the hook listener it registered. */
export function useLogger(): LoggerContext {
  if (!current) {
    throw new Error('useLogger() was called outside a logger install.')
  }
  return current
}

/** Creates a feature once per install and returns the same instance on each later call. */
export function useFeature<T>(name: string, create: () => T): T {
  const { features } = useLogger()
  if (!features.has(name)) {
    features.set(name, create())
  }
  return features.get(name) as T
}

/** Builds the context `install` provides: hook listeners re-enter it, so `useX()` works while they run. */
export function createLoggerContext({
  hooks,
  writer,
  logLevel,
  silent,
  audience,
  text,
}: {
  hooks: Hookable<KubbHooks>
  writer: LoggerWriter
  logLevel: number
  silent: boolean
  audience: DiagnosticFormatOptions['audience']
  text: (message: string) => string
}): LoggerContext {
  const ctx: LoggerContext = {
    writer,
    logLevel,
    silent,
    audience,
    human: audience === 'human',
    session: false,
    text,
    hook(name, fn) {
      return hooks.hook(name, (...args) => provideLogger(ctx, () => fn(...args)))
    },
    onRun(name, fn) {
      return ctx.hook(name, (...args) => (ctx.session ? undefined : fn(...args)))
    },
    features: new Map(),
  }
  return ctx
}

/** `✓ message info`, with the info dimmed. */
export function formatLine(symbol: string, message: string, info?: string): string {
  return useLogger().text([symbol, message, info && styleText('dim', info)].filter(Boolean).join(' '))
}
