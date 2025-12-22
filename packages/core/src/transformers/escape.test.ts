import { describe, expect, test } from 'vitest'
import { escape, jsStringEscape } from './escape.ts'

describe('escape', () => {
  test('return escape text', () => {
    expect(escape()).toBe('')
    expect(escape('`test')).toBe('\\`test')
  })

  test('return jsStringEscape text', () => {
    expect(jsStringEscape('"Hello World!"')).toMatchInlineSnapshot(`"\\"Hello World!\\""`)
    expect(jsStringEscape("HTTP Status'")).toMatchInlineSnapshot(`"HTTP Status\\'"`)
    expect(jsStringEscape(null)).toMatchInlineSnapshot(`"null"`)
    expect(jsStringEscape(undefined)).toMatchInlineSnapshot(`"undefined"`)
    expect(jsStringEscape(false)).toMatchInlineSnapshot(`"false"`)
    expect(jsStringEscape(0.0)).toMatchInlineSnapshot(`"0"`)
    expect(jsStringEscape({})).toMatchInlineSnapshot(`"[object Object]"`)
    expect(jsStringEscape('')).toMatchInlineSnapshot(`""`)
  })

  test('jsStringEscape handles line terminators', () => {
    expect(jsStringEscape('line1\nline2')).toBe('line1\\nline2')
    expect(jsStringEscape('line1\rline2')).toBe('line1\\rline2')
    expect(jsStringEscape('line1\u2028line2')).toBe('line1\\u2028line2')
    expect(jsStringEscape('line1\u2029line2')).toBe('line1\\u2029line2')
  })

  test('jsStringEscape handles backslash', () => {
    expect(jsStringEscape('path\\to\\file')).toBe('path\\\\to\\\\file')
  })
})
