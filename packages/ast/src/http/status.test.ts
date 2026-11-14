import { describe, expect, it } from 'vitest'
import { getClass, isError, isSuccess, toCode } from './status.ts'

describe('getClass', () => {
  it.each([
    ['201', 2],
    ['2xx', 2],
    [404, 4],
    ['default', null],
  ] as const)('class(%s) is %s', (code, expected) => {
    expect(getClass(code)).toBe(expected)
  })
})

describe('isSuccess and isError', () => {
  it('tells successes from errors', () => {
    expect(isSuccess('2xx')).toBe(true)
    expect(isError('5xx')).toBe(true)
    expect(isError('default')).toBe(false)
    expect(isSuccess('default')).toBe(false)
  })

  it('reads the status code from a response', () => {
    expect(isSuccess({ statusCode: '201' })).toBe(true)
    expect(isError({ statusCode: '4xx' })).toBe(true)
  })
})

describe('toCode', () => {
  it.each([
    ['2xx', 200],
    ['4xx', 400],
    ['default', 200],
    ['201', 201],
  ] as const)('toCode(%s) is %s', (code, expected) => {
    expect(toCode(code)).toBe(expected)
  })

  it('reads the status code from a response', () => {
    expect(toCode({ statusCode: 'default' })).toBe(200)
  })
})
