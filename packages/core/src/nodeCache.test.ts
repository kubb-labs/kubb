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

  it('computes with the factory on the first ensureItem and reuses it afterwards', () => {
    const cache = createNodeCache()
    const factory = vi.fn(() => 'computed')

    expect(cache.ensureItem('key', factory)).toBe('computed')
    expect(cache.ensureItem('key', factory)).toBe('computed')
    expect(factory).toHaveBeenCalledOnce()
  })

  it('treats a stored undefined as present, so ensureItem does not recompute it', () => {
    const cache = createNodeCache()
    const factory = vi.fn(() => undefined)

    cache.ensureItem('key', factory)
    cache.ensureItem('key', factory)

    expect(factory).toHaveBeenCalledOnce()
  })
})
