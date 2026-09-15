import { getAgentName } from '../agent.ts'
import { isCIEnvironment } from '@internals/utils'

/**
 * Returns `true` when the process has an interactive TTY with a valid terminal
 * width and is not running in CI.
 *
 * Some IDE-embedded terminals report `isTTY = true` but set `columns` to `0`,
 * which breaks clack's box-drawing helpers (they call `String.prototype.repeat`
 * with a negative count and throw a `RangeError`). A positive column count is
 * required before the TTY counts as usable.
 *
 * @example
 * ```ts
 * if (canUseTTY()) {
 *   renderProgressBar()
 * }
 * ```
 */
export function canUseTTY(): boolean {
  return process.stdout.isTTY && (process.stdout.columns ?? 0) > 0 && !isCIEnvironment()
}

/**
 * Returns `true` when output can carry spinners and clack's gutter: an interactive TTY that no AI
 * coding agent is reading. Cursor-movement escapes are hard for an agent to parse even over a
 * pseudo-TTY, so it gets the plain writer.
 */
export function isRichOutput(): boolean {
  return canUseTTY() && !getAgentName()
}
