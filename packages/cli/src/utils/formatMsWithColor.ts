import { formatMs } from '@kubb/core/utils'
import pc from 'picocolors'

/**
 * Formats milliseconds with color based on duration thresholds:
 * - Green: <= 500ms
 * - Yellow: > 500ms and <= 1000ms
 * - Red: > 1000ms
 */
export function formatMsWithColor(ms: number): string {
  const formatted = formatMs(ms)

  if (ms <= 500) {
    return pc.green(formatted)
  }

  if (ms <= 1000) {
    return pc.yellow(formatted)
  }

  return pc.red(formatted)
}
