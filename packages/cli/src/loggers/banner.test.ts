import { styleText } from 'node:util'
import { describe, expect, it } from 'vitest'
import { formatMsWithColor } from './banner.ts'

describe('formatMsWithColor', () => {
  it.each([
    { ms: 100, color: 'green', text: '100ms' },
    { ms: 500, color: 'green', text: '500ms' },
    { ms: 501, color: 'yellow', text: '501ms' },
    { ms: 750, color: 'yellow', text: '750ms' },
    { ms: 1000, color: 'yellow', text: '1.00s' },
    { ms: 1001, color: 'red', text: '1.00s' },
    { ms: 2000, color: 'red', text: '2.00s' },
    { ms: 60000, color: 'red', text: '1m 0.0s' },
  ] as const)('returns $text in $color for $ms ms', ({ ms, color, text }) => {
    expect(formatMsWithColor(ms)).toBe(styleText(color, text))
  })
})
