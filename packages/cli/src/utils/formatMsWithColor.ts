import { styleText } from 'node:util'
import { formatMs } from '@kubb/core/utils'

/**
 * Formats milliseconds with color based on duration thresholds:
 * - Green: <= 500ms
 * - Yellow: > 500ms and <= 1000ms
 * - Red: > 1000ms
 */
export function formatMsWithColor(ms: number): string {
  const formatted = formatMs(ms)

  if (ms <= 500) {
    return styleText('green', formatted)
  }

  if (ms <= 1000) {
    return styleText('yellow', formatted)
  }

  return styleText('red', formatted)
}
