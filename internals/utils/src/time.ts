/**
 * Calculates elapsed time in milliseconds from a high-resolution `process.hrtime` start time.
 * Rounds to 2 decimal places for sub-millisecond precision without noise.
 *
 * @example
 * ```ts
 * const start = process.hrtime()
 * doWork()
 * getElapsedMs(start) // 42.35
 * ```
 */
export function getElapsedMs(hrStart: [number, number]): number {
  const [seconds, nanoseconds] = process.hrtime(hrStart)
  const ms = seconds * 1000 + nanoseconds / 1e6
  return Math.round(ms * 100) / 100
}

/**
 * Converts a millisecond duration into a human-readable string (`ms`, `s`, or `m s`).
 *
 * @example
 * ```ts
 * formatMs(250)   // '250ms'
 * formatMs(1500)  // '1.50s'
 * formatMs(90000) // '1m 30.0s'
 * ```
 */
export function formatMs(ms: number): string {
  if (ms >= 60000) {
    const mins = Math.floor(ms / 60000)
    const secs = ((ms % 60000) / 1000).toFixed(1)
    return `${mins}m ${secs}s`
  }

  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  return `${Math.round(ms)}ms`
}

/**
 * Formats the elapsed time since `hrStart` as a human-readable string.
 *
 * @example
 * ```ts
 * const start = process.hrtime()
 * doWork()
 * formatHrtime(start) // '1.50s'
 * ```
 */
export function formatHrtime(hrStart: [number, number]): string {
  return formatMs(getElapsedMs(hrStart))
}
