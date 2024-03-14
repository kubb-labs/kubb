import { toIndexKey } from './toIndexKey.ts'

describe('toIndexKey', () => {
  test('return toIndexKey text', () => {
    expect(toIndexKey('Hello World!')).toBe('"Hello World!"')
    expect(toIndexKey('2')).toBe(2)
    expect(toIndexKey(2)).toBe(2)
    expect(toIndexKey('0')).toBe(0)
    expect(toIndexKey(0)).toBe(0)
    expect(toIndexKey('')).toBe('""')
    expect(toIndexKey(true as unknown as string)).toBe('"true"')
  })
})
