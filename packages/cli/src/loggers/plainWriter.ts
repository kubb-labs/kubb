import type { LoggerWriter } from './types.ts'

/**
 * Prefixes that stand in for the symbols clack draws, so plain output reads the same way.
 */
export const SYMBOLS = { info: 'ℹ', warn: '⚠', error: '✗', step: '◇' } as const

/**
 * Draws with one `write` call per line, e.g. `console.error` so stdout carries only JSON. Nothing
 * animates, so a step prints at start and end.
 */
export function createPlainWriter(write: (line: string) => void): LoggerWriter {
  return {
    audience: 'agent',
    group: write,
    groupEnd: write,
    step: (text) => write(`${SYMBOLS.step} ${text}`),
    info: write,
    success: write,
    warn: write,
    error: (text) => write(`${SYMBOLS.error} ${text}`),
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
 * Draws on the console, for non-TTY environments and for an AI coding agent reading the output.
 * Reports the same run in the same order as `clackWriter`, without the animation.
 */
export const plainWriter = createPlainWriter((line) => console.log(line))
