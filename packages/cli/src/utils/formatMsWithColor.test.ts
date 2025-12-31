import pc from 'picocolors'
import { describe, expect, it } from 'vitest'
import { formatMsWithColor } from './formatMsWithColor.ts'

describe('formatMsWithColor', () => {
  it('should format with green color when duration <= 500ms', () => {
    expect(formatMsWithColor(100)).toBe(pc.green('100ms'))
    expect(formatMsWithColor(500)).toBe(pc.green('500ms'))
  })

  it('should format with yellow color when duration > 500ms and <= 1000ms', () => {
    expect(formatMsWithColor(501)).toBe(pc.yellow('501ms'))
    expect(formatMsWithColor(750)).toBe(pc.yellow('750ms'))
    expect(formatMsWithColor(1000)).toBe(pc.yellow('1.00s'))
  })

  it('should format with red color when duration > 1000ms', () => {
    expect(formatMsWithColor(1001)).toBe(pc.red('1.00s'))
    expect(formatMsWithColor(2000)).toBe(pc.red('2.00s'))
    expect(formatMsWithColor(60000)).toBe(pc.red('1m 0.0s'))
  })
})
