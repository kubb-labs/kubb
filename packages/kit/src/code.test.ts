import { describe, expect, it } from 'vitest'
import { isIdentifier, jsDoc, key, literal, string } from './code.ts'

describe('code', () => {
  it('string escapes quotes, backslashes and line breaks', () => {
    expect(string("o'clock")).toBe("'o\\'clock'")
    expect(string('a\\b\nc\rd')).toBe("'a\\\\b\\nc\\rd'")
    expect(string(undefined)).toBe("''")
    expect(string(42)).toBe("'42'")
  })

  it('isIdentifier rejects reserved words and invalid names', () => {
    expect(isIdentifier('status')).toBe(true)
    expect(isIdentifier('class')).toBe(false)
    expect(isIdentifier('42foo')).toBe(false)
    expect(isIdentifier('')).toBe(false)
  })

  it('key quotes only names that are not identifier-shaped', () => {
    expect(key('class')).toBe('class')
    expect(key('x-total')).toBe("'x-total'")
  })

  it('literal renders nested JSON values', () => {
    expect(literal({ id: 1, 'x-tag': ['a'], ok: true, none: null })).toBe("{ id: 1, 'x-tag': ['a'], ok: true, none: null }")
  })

  it('jsDoc escapes a leading @ on each line', () => {
    expect(jsDoc('intro\n  @example value')).toBe('intro\n  \\@example value')
  })
})
