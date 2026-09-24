import { createLogger } from './createLogger.ts'
import type { Logger, LoggerWriter } from './defineLogger.ts'

/**
 * Prefixes that stand in for the symbols clack draws, so plain output reads the same way.
 */
const SYMBOLS = { info: 'ℹ', warn: '⚠', error: '✗', step: '◇' } as const

/**
 * Draws with one `write` call per line. Nothing animates, so a step prints when it starts and again
 * when it ends, and every message it was given in between.
 */
function createWriter(write: (line: string) => void): LoggerWriter {
  return {
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
}

/**
 * The plain logger, writing each line through `write`. `kubb studio snapshot --json` passes
 * `console.error`, so the log stays readable while stdout carries only the JSON result.
 */
export function createPlainLogger(write: (line: string) => void) {
  return {
    name: 'plain',
    install: createLogger(createWriter(write)),
  } satisfies Logger
}

/**
 * Console adapter for non-TTY environments, and for an AI coding agent reading the output. Reports
 * the same run in the same order as `clackLogger`, without the animation.
 */
export const plainLogger = createPlainLogger((line) => console.log(line))
