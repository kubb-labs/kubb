import { getNestedAccessor } from './getNestedAccessor.ts'

describe('getNestedAccessor', () => {
  it('should convert dot notation to accessor expression', () => {
    expect(getNestedAccessor('pagination.next.id', 'lastPage')).toBe("lastPage?.['pagination']?.['next']?.['id']")
  })

  it('should convert array path to accessor expression', () => {
    expect(getNestedAccessor(['pagination', 'next', 'id'], 'lastPage')).toBe("lastPage?.['pagination']?.['next']?.['id']")
  })

  it('should handle single property', () => {
    expect(getNestedAccessor('cursor', 'lastPage')).toBe("lastPage?.['cursor']")
  })

  it('should handle different base accessors', () => {
    expect(getNestedAccessor('pagination.prev.id', 'firstPage')).toBe("firstPage?.['pagination']?.['prev']?.['id']")
  })

  it('should return undefined for empty string', () => {
    expect(getNestedAccessor('', 'lastPage')).toBeUndefined()
  })

  it('should return undefined for empty array', () => {
    expect(getNestedAccessor([], 'lastPage')).toBeUndefined()
  })

  it('should handle deeply nested paths', () => {
    expect(getNestedAccessor('data.meta.pagination.next.cursor', 'response')).toBe(
      "response?.['data']?.['meta']?.['pagination']?.['next']?.['cursor']",
    )
  })
})
