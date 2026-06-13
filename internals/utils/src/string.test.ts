import { describe, expect, test } from 'vitest'
import { singleQuote } from './string.ts'

describe('singleQuote', () => {
  test('wraps a value in single quotes', () => {
    expect(singleQuote('foo')).toBe("'foo'")
    expect(singleQuote(200)).toBe("'200'")
  })

  test('escapes embedded single quotes and backslashes', () => {
    expect(singleQuote("o'clock")).toBe("'o\\'clock'")
    expect(singleQuote('a\\b')).toBe("'a\\\\b'")
  })

  test('returns empty quotes for nullish', () => {
    expect(singleQuote(undefined)).toBe("''")
    expect(singleQuote(null)).toBe("''")
  })
})
