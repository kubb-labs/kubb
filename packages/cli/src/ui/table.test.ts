import { describe, expect, it } from 'vitest'
import { formatTable } from './table.ts'

describe('formatTable', () => {
  it('pads each column to its widest cell', () => {
    expect(
      formatTable([
        ['a', 'bb'],
        ['ccc', 'd'],
      ]),
    ).toStrictEqual(['a    bb', 'ccc  d'])
  })
})
