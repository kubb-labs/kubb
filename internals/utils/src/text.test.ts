import { describe, expect, it } from 'vitest'
import { dedent, indent, unquote } from './text.ts'

describe('text', () => {
  it('indents non-empty lines and keeps blank lines empty', () => {
    expect(indent('a\n\n  b')).toBe('  a\n\n    b')
    expect(indent('a', '\t')).toBe('\ta')
  })

  it('strips the common indent and the surrounding blank lines', () => {
    expect(dedent('\n    a\n      b\n\n')).toBe('a\n  b')
  })

  it('strips one matching pair of quotes', () => {
    expect(unquote('"a"')).toBe('a')
    expect(unquote('\'a"')).toBe('\'a"')
    expect(unquote('`a`')).toBe('a')
  })
})
