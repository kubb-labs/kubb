import { describe, expect, test } from 'vitest'
import { combineCodes } from './combineCodes.ts'

describe('combineCodes', () => {
  test('should combine multiple code strings with newlines', () => {
    const codes = ['const a = 1', 'const b = 2', 'const c = 3']
    const result = combineCodes(codes)
    expect(result).toBe('const a = 1\nconst b = 2\nconst c = 3')
  })

  test('should handle empty array', () => {
    const result = combineCodes([])
    expect(result).toBe('')
  })

  test('should handle single code string', () => {
    const result = combineCodes(['const a = 1'])
    expect(result).toBe('const a = 1')
  })
})
