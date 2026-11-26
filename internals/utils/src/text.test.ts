import { describe, expect, it } from 'vitest'
import { dedent, indent, uniqueName, unquote } from './text.ts'

describe('text', () => {
  it('indents non-empty lines and keeps blank lines empty', () => {
    expect(indent({ text: 'a\n\n  b' })).toBe('  a\n\n    b')
    expect(indent({ text: 'a', unit: '\t' })).toBe('\ta')
  })

  it('strips the common indent and the surrounding blank lines', () => {
    expect(dedent('\n    a\n      b\n\n')).toBe('a\n  b')
  })

  it('strips one matching pair of quotes', () => {
    expect(unquote('"a"')).toBe('a')
    expect(unquote('\'a"')).toBe('\'a"')
    expect(unquote('`a`')).toBe('a')
  })

  it('adds the first free numeric suffix to a taken name', () => {
    const taken = new Set(['Options', 'Options2'])

    expect(uniqueName('Pet', (name) => taken.has(name))).toBe('Pet')
    expect(uniqueName('Options', (name) => taken.has(name))).toBe('Options3')
  })
})
