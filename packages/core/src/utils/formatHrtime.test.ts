import pc from 'picocolors'
import { describe, expect, it } from 'vitest'
import { formatMs, formatMsWithColor } from './formatHrtime.ts'

describe('formatMs', () => {
  it('should format milliseconds < 1000 as ms', () => {
    expect(formatMs(100)).toBe('100ms')
    expect(formatMs(500)).toBe('500ms')
    expect(formatMs(999)).toBe('999ms')
  })

  it('should format milliseconds >= 1000 as seconds', () => {
    expect(formatMs(1000)).toBe('1.00s')
    expect(formatMs(1500)).toBe('1.50s')
    expect(formatMs(2000)).toBe('2.00s')
  })

  it('should format milliseconds >= 60000 as minutes and seconds', () => {
    expect(formatMs(60000)).toBe('1m 0.0s')
    expect(formatMs(90000)).toBe('1m 30.0s')
    expect(formatMs(125000)).toBe('2m 5.0s')
  })
})

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
