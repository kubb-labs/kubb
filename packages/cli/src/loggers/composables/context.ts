import { styleText } from 'node:util'
import { type Config, type DiagnosticFormatOptions, type Hookable, type KubbHooks, logLevel as logLevelMap } from '@kubb/core'
import type { LoggerWriter } from '../types.ts'

/**
 * What `installLogger` shares with its features: the writer, the verbosity flags, and the two
 * run-wide flags a feature flips for the others to read.
 */
export type LoggerContext = {
  hooks: Hookable<KubbHooks>
  writer: LoggerWriter
  logLevel: number
  silent: boolean
  audience: DiagnosticFormatOptions['audience']
  human: boolean
  /** Set once a rich `kubb studio` session connects: each run then shows as one job line. */
  session: boolean
  /** Whether a config's group is open, so a problem can wait for its end. */
  groupOpen: boolean
  /** Prefixes a `[HH:MM:SS]` timestamp at verbose and above. */
  text: (message: string) => string
  /** `✓ message info`, with the info dimmed. */
  line: (symbol: string, message: string, info?: string) => string
  /** Registers a per-run hook. In a Studio session the job line stands for the whole run, so these stay quiet. */
  onRun: <Name extends keyof KubbHooks & string>(name: Name, fn: (...args: KubbHooks[Name]) => unknown) => () => void
}

export function createLoggerContext({ hooks, writer, logLevel }: { hooks: Hookable<KubbHooks>; writer: LoggerWriter; logLevel: number }): LoggerContext {
  const text = (message: string) => (logLevel >= logLevelMap.verbose ? `${styleText('dim', `[${clock()}]`)} ${message}` : message)
  const ctx: LoggerContext = {
    hooks,
    writer,
    logLevel,
    silent: logLevel <= logLevelMap.silent,
    audience: writer.audience,
    human: writer.audience === 'human',
    session: false,
    groupOpen: false,
    text,
    line: (symbol, message, info) => text([symbol, message, info && styleText('dim', info)].filter(Boolean).join(' ')),
    onRun(name, fn) {
      return hooks.hook(name, (...args) => (ctx.session ? undefined : fn(...args)))
    },
  }
  return ctx
}

/** `HH:MM:SS` in 24-hour time. */
export function clock(date = new Date()): string {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** Display path for a config's input: the string form, or its `path` field when the input is an object. */
export function getInputPath(config: Config): string | undefined {
  const { input } = config
  if (typeof input === 'string') return input
  return typeof input?.path === 'string' ? input.path : undefined
}
