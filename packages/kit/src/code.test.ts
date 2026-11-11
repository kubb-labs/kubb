import { describe, expect, it } from 'vitest'
import { string } from './code.ts'

describe('code', () => {
  it('string escapes quotes, backslashes and line breaks', () => {
    expect(string("o'clock")).toBe("'o\\'clock'")
    expect(string('a\\b\nc\rd')).toBe("'a\\\\b\\nc\\rd'")
    expect(string(undefined)).toBe("''")
    expect(string(42)).toBe("'42'")
  })
})
