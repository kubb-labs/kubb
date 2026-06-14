import { describe, expect, it } from 'vitest'
import { getNestedAccessor, jsStringEscape, stringify, stringifyObject, toRegExpString, trimQuotes } from './strings.ts'

describe('trimQuotes', () => {
  it('strips a balanced double-quote pair', () => {
    expect(trimQuotes('"hello"')).toBe('hello')
  })

  it('strips a balanced single-quote pair', () => {
    expect(trimQuotes("'hello'")).toBe('hello')
  })

  it('strips a balanced backtick pair', () => {
    expect(trimQuotes('`hello`')).toBe('hello')
  })

  it('leaves an unquoted string unchanged', () => {
    expect(trimQuotes('hello')).toBe('hello')
  })

  it('leaves a mismatched pair unchanged', () => {
    expect(trimQuotes('"hello\'')).toBe('"hello\'')
  })
})

describe('stringify', () => {
  it('wraps a plain string in single quotes', () => {
    expect(stringify('hello')).toBe("'hello'")
  })

  it('strips existing surrounding quotes first', () => {
    expect(stringify('"hello"')).toBe("'hello'")
  })

  it('escapes an embedded single quote', () => {
    expect(stringify("o'clock")).toBe("'o\\'clock'")
  })

  it('escapes a newline', () => {
    expect(stringify('a\nb')).toBe("'a\\nb'")
  })

  it('serializes numbers and booleans', () => {
    expect(stringify(42)).toBe("'42'")
    expect(stringify(true)).toBe("'true'")
  })

  it('returns empty quotes for undefined', () => {
    expect(stringify(undefined)).toBe("''")
  })
})

describe('jsStringEscape', () => {
  it('escapes quotes and backslashes', () => {
    expect(jsStringEscape('say "hi"')).toBe('say \\"hi\\"')
    expect(jsStringEscape("o'clock")).toBe("o\\'clock")
    expect(jsStringEscape('a\\b')).toBe('a\\\\b')
  })

  it('escapes line terminators', () => {
    expect(jsStringEscape('a\nb\rc')).toBe('a\\nb\\rc')
    expect(jsStringEscape('a\u2028b\u2029c')).toBe('a\\u2028b\\u2029c')
  })
})

describe('toRegExpString', () => {
  it('renders a RegExp constructor call', () => {
    expect(toRegExpString('foo')).toBe('new RegExp("foo")')
  })

  it('extracts inline flags into a second argument', () => {
    expect(toRegExpString('^(?im)foo')).toBe('new RegExp("^foo", "im")')
  })

  it('renders a regex literal when func is null', () => {
    expect(toRegExpString('^(?im)foo', null)).toBe('/^foo/im')
  })

  it('strips surrounding quotes before parsing', () => {
    expect(toRegExpString('"foo"')).toBe('new RegExp("foo")')
  })
})

describe('stringifyObject', () => {
  it('renders flat key-value pairs', () => {
    expect(stringifyObject({ a: 1, b: 'x' })).toBe('a: 1,\nb: x')
  })

  it('renders nested objects with indentation', () => {
    expect(stringifyObject({ foo: 'bar', nested: { a: 1 } })).toBe('foo: bar,\nnested: {\n        a: 1\n      }')
  })
})

describe('getNestedAccessor', () => {
  it('renders an optional-chaining accessor from a dotted path', () => {
    expect(getNestedAccessor('pagination.next.id', 'lastPage')).toBe("lastPage?.['pagination']?.['next']?.['id']")
  })

  it('accepts a string array', () => {
    expect(getNestedAccessor(['a', 'b'], 'root')).toBe("root?.['a']?.['b']")
  })

  it('returns null for an empty path', () => {
    expect(getNestedAccessor('', 'root')).toBeNull()
  })
})
