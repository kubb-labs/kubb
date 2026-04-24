import { describe, expect, it } from 'vitest'
import { toPosixPath } from './path.ts'

describe('toPosixPath', () => {
  it('returns POSIX paths unchanged', () => {
    expect(toPosixPath('/repo/src/gen/types/pet.ts')).toBe('/repo/src/gen/types/pet.ts')
  })

  it('converts backslash separators to forward slashes', () => {
    expect(toPosixPath('C:\\repo\\src\\gen\\types\\pet.ts')).toBe('C:/repo/src/gen/types/pet.ts')
  })

  it('handles mixed separators', () => {
    expect(toPosixPath('C:\\repo/src\\gen/types\\pet.ts')).toBe('C:/repo/src/gen/types/pet.ts')
  })

  it('returns the empty string unchanged', () => {
    expect(toPosixPath('')).toBe('')
  })
})
