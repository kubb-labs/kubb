import process from 'node:process'

/**
 * `true` when the current process is Bun. opentui's native module is
 * Bun-exclusive today; Node support is still in-progress upstream.
 */
export function isBun(): boolean {
  return typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined'
}

/**
 * `true` when stdout is an interactive TTY. The TUI must never engage on
 * pipes, redirected output, or CI runners without a tty allocation.
 */
export function isInteractiveTTY(): boolean {
  return Boolean(process.stdout.isTTY && process.stdin.isTTY)
}

/**
 * Reason why the TUI cannot be activated, or `null` when it can.
 * Surface this verbatim through a `kubb:warn` event so the user understands
 * why we fell back to the clack logger.
 */
export function getTuiUnavailableReason(): string | null {
  if (!isBun()) {
    return 'TUI requires the Bun runtime (opentui is Bun-only). Falling back to clack output.'
  }
  if (!isInteractiveTTY()) {
    return 'TUI requires an interactive TTY. Falling back to plain output.'
  }
  return null
}
