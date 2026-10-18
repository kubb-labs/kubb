import { stripVTControlCharacters, styleText } from 'node:util'
import { describe, expect, it } from 'vitest'
import { type Expression, formatMsWithColor, getIntro, pixels, wakeUp } from './banner.ts'

describe('getIntro', () => {
  function draw(expression: Expression): Array<string> {
    return stripVTControlCharacters(getIntro({ title: 'title', description: 'description', version: '5.0.0', expression })).split('\n')
  }

  it('puts the text beside the 9-cell mascot, one line per row', () => {
    expect(draw('open').map((line) => line.length)).toEqual([13 + 'KUBB v5.0.0'.length, 13 + 'title'.length, 13 + '➜ description'.length])
  })

  it.each([...new Set(wakeUp.map(([expression]) => expression))])('keeps every 2 × 2 block of %s to the two colors a quadrant glyph can show', (expression) => {
    const rows = pixels(expression)
    for (let y = 0; y < rows.length; y += 2) {
      for (let x = 0; x < rows[y]!.length; x += 2) {
        expect(new Set([rows[y]![x], rows[y]![x + 1], rows[y + 1]![x], rows[y + 1]![x + 1]]).size).toBeLessThanOrEqual(2)
      }
    }
  })

  it.each([...new Set(wakeUp.map(([expression]) => expression))])(
    'draws %s with the same line widths as open eyes, so each frame overwrites the last',
    (expression) => {
      expect(draw(expression).map((line) => line.length)).toEqual(draw('open').map((line) => line.length))
    },
  )
})

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
