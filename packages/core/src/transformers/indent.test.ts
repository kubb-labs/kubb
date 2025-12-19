import { describe, expect, test } from 'vitest'
import { createIndent } from './indent.ts'

describe('createIndent', () => {
  test('should create indent with specified size', () => {
    expect(createIndent(0)).toBe('')
    expect(createIndent(2)).toBe('  ')
    expect(createIndent(4)).toBe('    ')
    expect(createIndent(8)).toBe('        ')
  })
})
