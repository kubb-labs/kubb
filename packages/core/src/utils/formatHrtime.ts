/**
 * Calculates elapsed time in milliseconds from a high-resolution start time.
 * Rounds to 2 decimal places to provide sub-millisecond precision without noise.
 */
export function getElapsedMs(hrStart: [number, number]): number {
  const [seconds, nanoseconds] = process.hrtime(hrStart)
  const ms = seconds * 1000 + nanoseconds / 1e6
  return Math.round(ms * 100) / 100
}

/**
 * Converts a millisecond duration into a human-readable string.
 * Adjusts units (ms, s, m s) based on the magnitude of the duration.
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
  return `${Math.round(ms).toFixed(0)}ms`
}

/**
 * Convenience helper to get and format elapsed time in one step.
 */
export function formatHrtime(hrStart: [number, number]): string {
  return formatMs(getElapsedMs(hrStart))
}
