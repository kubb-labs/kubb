import { TextAttributes } from '@opentui/core'

/**
 * Pre-computed `attributes` bitmasks for the modifiers we use in the UI.
 * Composed by OR-ing the {@link TextAttributes} constants opentui ships.
 */
export const attrs = {
  none: TextAttributes.NONE,
  bold: TextAttributes.BOLD,
  dim: TextAttributes.DIM,
  italic: TextAttributes.ITALIC,
  underline: TextAttributes.UNDERLINE,
} as const

/**
 * Format an elapsed duration as `1.23s` or `412ms`. Defaults to `0ms` when no
 * start time has been recorded yet.
 */
export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0ms'
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

/**
 * Resolve the elapsed time string between `startedAt` and an optional
 * `finishedAt` boundary. When the run is still in progress, the current
 * wall-clock is used instead.
 */
export function formatElapsed(startedAt?: number, finishedAt?: number): string {
  if (!startedAt) return '—'
  const end = finishedAt ?? Date.now()
  return formatMs(end - startedAt)
}

/**
 * Trim a path-like string from the left so it fits within `max` characters,
 * preserving the tail (which is the more useful part for file paths).
 */
export function truncateLeft(value: string, max: number): string {
  if (value.length <= max) return value
  return `…${value.slice(value.length - max + 1)}`
}

/**
 * Truncate a string from the right with an ellipsis. Useful for plugin names
 * and other left-anchored identifiers shown in narrow columns.
 */
export function truncateRight(value: string, max: number): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

const ANSI_RE = /\[[\d;?]*[a-zA-Z]/g

/**
 * Strip ANSI SGR escape sequences from a string. Kubb's hook payloads contain
 * `styleText('bold', …)` output meant for clack; opentui doesn't parse ANSI
 * so we plain-text the input before storing it in state.
 */
export function stripAnsi(value: string): string {
  return value.replace(ANSI_RE, '')
}
