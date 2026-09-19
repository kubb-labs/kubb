import { createLogger } from './createLogger.ts'
import type { Logger, LoggerWriter } from './defineLogger.ts'

/**
 * Prefixes that stand in for the symbols clack draws, so plain output reads the same way.
 */
const SYMBOLS = { info: 'ℹ', warn: '⚠', error: '✗', step: '◇' } as const

function write(line: string): void {
  console.log(line)
}

/**
 * Draws with `console.log` alone. Nothing animates, so a step prints when it starts and again when
 * it ends, and every message it was given in between.
 */
const writer: LoggerWriter = {
  group: write,
  groupEnd: write,
  step: (text) => write(`${SYMBOLS.step} ${text}`),
  info: write,
  success: write,
  warn: write,
  error: write,
  block: (lines) => write(lines.join('\n')),
  raw: (lines) => write(lines.join('\n')),
  diagnostic: (lines) => write(lines.join('\n')),
  update: (lines, title) => write([title, ...lines].join('\n')),
  spinner: () => ({
    start: write,
    message: write,
    clear: () => {},
    stop: (text) => text && write(text),
    error: (text) => write(`${SYMBOLS.error} ${text}`),
  }),
  progress: () => ({
    start: write,
    advance: write,
    stop: (text) => text && write(text),
  }),
}

/**
 * Console adapter for non-TTY environments, and for an AI coding agent reading the output. Reports
 * the same run in the same order as `clackLogger`, without the animation.
 */
export const plainLogger = {
  name: 'plain',
  install: createLogger(writer),
} satisfies Logger
