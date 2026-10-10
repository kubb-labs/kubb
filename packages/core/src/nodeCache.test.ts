import { describe, expect, it, vi } from 'vitest'
import { createNodeCache } from './nodeCache.ts'

describe('createNodeCache', () => {
  it('returns undefined for a key that was never set', () => {
    const cache = createNodeCache()

    expect(cache.readItem('missing')).toBeUndefined()
  })

  it('stores a value and returns it from writeItem and readItem', () => {
    const cache = createNodeCache()

    expect(cache.writeItem('name', 'pet')).toBe('pet')
    expect(cache.readItem<string>('name')).toBe('pet')
  })

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
