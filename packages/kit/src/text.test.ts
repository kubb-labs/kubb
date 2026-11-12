import { describe, expect, it } from 'vitest'
import { quote } from './text.ts'

describe('text', () => {
  it('quote escapes quotes, backslashes and line breaks', () => {
    expect(quote("o'clock")).toBe("'o\\'clock'")
    expect(quote('a\\b\nc\rd')).toBe("'a\\\\b\\nc\\rd'")
    expect(quote(undefined)).toBe("''")
    expect(quote(42)).toBe("'42'")
  })
})
