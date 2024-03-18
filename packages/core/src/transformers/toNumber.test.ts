import { isNumber, toNumber } from './toNumber.ts'

describe('toNumber', () => {
  test('return toNumber text', () => {
    expect(toNumber(0)).toBe(0)
    expect(toNumber(1)).toBe(1)
    expect(toNumber('2')).toBe(2)
    expect(toNumber('')).toBe(0)
    expect(toNumber('test')).toBe(NaN)
  })
})

describe('toNisNumberumber', () => {
  test('return isNumber text', () => {
    expect(isNumber(0)).toBeTruthy()
    expect(toNumber(1)).toBeTruthy()
    expect(toNumber('2')).toBeTruthy()
    expect(toNumber('')).toBeFalsy()
    expect(toNumber('test')).toBeFalsy()
  })
})
