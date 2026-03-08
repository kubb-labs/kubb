import { describe, expect, it } from 'vitest'
import { nameSorter } from './nameSorter.ts'

describe('nameSorter', () => {
  it('should sort by name in ascending order', () => {
    const items = [{ name: 'charlie' }, { name: 'alice' }, { name: 'bob' }]
    const sorted = items.sort(nameSorter)
    expect(sorted).toEqual([{ name: 'alice' }, { name: 'bob' }, { name: 'charlie' }])
  })
})
