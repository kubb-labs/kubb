import { describe, expect, test } from 'vitest'
import { trim, trimQuotes } from './trim.ts'

describe('trim', () => {
  test('should trim leading and trailing whitespace', () => {
    expect(trim('  test  ')).toBe('test')
    expect(trim('\ttest\t')).toBe('test')
    expect(trim('test')).toBe('test')
  })

  test('should preserve newlines within text', () => {
    expect(trim('line1\nline2')).toBe('line1\nline2')
    expect(trim('line1\r\nline2')).toBe('line1\r\nline2')
    expect(trim('  line1\nline2  ')).toBe('line1\nline2')
  })

  test('should handle multiple newlines', () => {
    expect(trim('line1\n\nline2')).toBe('line1\n\nline2')
    expect(trim('line1\r\n\r\nline2')).toBe('line1\r\n\r\nline2')
  })
})

describe('trimQuotes', () => {
  test('should remove double quotes', () => {
    expect(trimQuotes('"test"')).toBe('test')
  })

  test('should remove single quotes', () => {
    expect(trimQuotes("'test'")).toBe('test')
  })

  test('should remove backticks', () => {
    expect(trimQuotes('`test`')).toBe('test')
  })

  test('should return text as-is if no quotes', () => {
    expect(trimQuotes('test')).toBe('test')
  })
})
