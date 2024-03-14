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
})
