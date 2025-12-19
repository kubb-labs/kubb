
import { nameSorter } from './nameSorter.ts'

describe('nameSorter', () => {
  it('should sort by name in ascending order', () => {
    const items = [{ name: 'charlie' }, { name: 'alice' }, { name: 'bob' }]
    const sorted = items.sort(nameSorter)
    expect(sorted).toEqual([{ name: 'alice' }, { name: 'bob' }, { name: 'charlie' }])
  })

  it('should return -1 when first name is smaller', () => {
    const result = nameSorter({ name: 'alice' }, { name: 'bob' })
    expect(result).toBe(-1)
  })

  it('should return 1 when first name is larger', () => {
    const result = nameSorter({ name: 'bob' }, { name: 'alice' })
    expect(result).toBe(1)
  })

  it('should return 0 when names are equal', () => {
    const result = nameSorter({ name: 'alice' }, { name: 'alice' })
    expect(result).toBe(0)
  })
})
