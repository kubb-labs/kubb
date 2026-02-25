/**
 * Returns a masked version of a string, showing only the first and last few
 * characters. Useful for logging sensitive values (license keys, machine IDs)
 * without exposing the full value.
 *
 * @example
 * maskedString('KUBB_STUDIO-abc123-xyz789') // 'KUBB_STUDIO-…789'
 * maskedString('a1b2c3d4e5f6')              // 'a1b2…f6'
 */
export function maskedString(value: string, start = 8, end = 4): string {
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}…${value.slice(-end)}`
}
