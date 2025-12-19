import { createIndent } from './indent.ts'

describe('createIndent', () => {
  it('should create indent with specified size', () => {
    expect(createIndent(0)).toBe('')
    expect(createIndent(2)).toBe('  ')
    expect(createIndent(4)).toBe('    ')
    expect(createIndent(8)).toBe('        ')
  })
})
