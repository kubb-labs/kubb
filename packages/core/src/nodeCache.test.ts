import { describe, expect, it, vi } from 'vitest'
import { createNodeCache } from './nodeCache.ts'

describe('createNodeCache', () => {
  it.each([
    ['a value', 'computed'],
    ['undefined', undefined],
  ])('computes %s with the factory on the first ensureItem and reuses it afterwards', (_name, value) => {
    const cache = createNodeCache()
    const factory = vi.fn(() => value)

    expect(cache.ensureItem('key', factory)).toBe(value)
    expect(cache.ensureItem('key', factory)).toBe(value)
    expect(factory).toHaveBeenCalledOnce()
  })
})
