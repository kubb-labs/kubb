import { stripVTControlCharacters, styleText } from 'node:util'
import { describe, expect, it } from 'vitest'
import { type Expression, formatMsWithColor, getIntro, wakeUp } from './banner.ts'

describe('getIntro', () => {
  function draw(expression: Expression): Array<string> {
    return stripVTControlCharacters(getIntro({ title: 'title', description: 'description', version: '5.0.0', expression })).split('\n')
  }

  it('puts the text beside the face, two cells right of the 20-cell mascot', () => {
    expect(draw('open').map((line) => line.length)).toEqual([22, 22, 22, 24 + 'KUBB v5.0.0'.length, 24 + 'title'.length, 24 + '➜ description'.length, 22, 22])
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
