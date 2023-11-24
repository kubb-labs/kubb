import { escape, jsStringEscape } from './escape.ts'

describe('escape', () => {
  test('return escape text', () => {
    expect(escape()).toBe('')
    expect(escape('`test')).toBe('\\`test')
  })

  test('return jsStringEscape text', () => {
    expect(jsStringEscape('"Hello World!"')).toBe('\\"Hello World!\\"')
    expect(jsStringEscape(null)).toBe('null')
    expect(jsStringEscape(undefined)).toBe('undefined')
    expect(jsStringEscape(false)).toBe('false')
    expect(jsStringEscape(0.0)).toBe('0')
    expect(jsStringEscape({})).toBe('[object Object]')
    expect(jsStringEscape('')).toBe('')

    expect(globalThis.escape('^[a-zA-Z0-9.-]*$')).not.toBe('^[a-zA-Z0-9.-]*$')
    expect(jsStringEscape('^[a-zA-Z0-9.-]*$')).toBe('^[a-zA-Z0-9.-]*$')
  })
})
