import { styleText } from 'node:util'
import { describe, expect, it, onTestFinished } from 'vitest'
import { formatMsWithColor, getIntro } from './banner.ts'

describe('formatMsWithColor', () => {
  it.each([
    { ms: 500, color: 'green', text: '500ms' },
    { ms: 501, color: 'yellow', text: '501ms' },
    { ms: 1000, color: 'yellow', text: '1.00s' },
    { ms: 1001, color: 'red', text: '1.00s' },
  ] as const)('returns $text in $color for $ms ms', ({ ms, color, text }) => {
    expect(formatMsWithColor(ms)).toBe(styleText(color, text))
  })
})

describe('getIntro', () => {
  const options = { title: 'kubb.config.ts', description: 'Ready to start', version: '5.0.0' }

  it('draws a three-line mascot next to the version, title, and description', () => {
    const lines = getIntro({ ...options, areEyesOpen: true }).split('\n')

    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('v5.0.0')
    expect(lines[1]).toContain('kubb.config.ts')
    expect(lines[2]).toContain('Ready to start')
  })

  it('closes the eyes by dropping the pupils', () => {
    // Eyes differ only by color, and test stdout is not a color terminal.
    const hasColors = process.stdout.hasColors
    process.stdout.hasColors = () => true
    onTestFinished(() => {
      process.stdout.hasColors = hasColors
    })

    expect(getIntro({ ...options, areEyesOpen: false })).not.toBe(getIntro({ ...options, areEyesOpen: true }))
  })
})
