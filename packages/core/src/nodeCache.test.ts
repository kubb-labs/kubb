import { describe, expect, it, vi } from 'vitest'
import { createNodeCache } from './nodeCache.ts'

describe('createNodeCache', () => {
  it('returns undefined for a key that was never set', () => {
    const cache = createNodeCache()

    expect(cache.get('missing')).toBeUndefined()
  })

  it('stores a value and returns it from set and get', () => {
    const cache = createNodeCache()

    expect(cache.set('name', 'pet')).toBe('pet')
    expect(cache.get<string>('name')).toBe('pet')
  })

  it('computes with the factory on the first getOrSet and reuses it afterwards', () => {
    const cache = createNodeCache()
    const factory = vi.fn(() => 'computed')

    expect(cache.getOrSet('key', factory)).toBe('computed')
    expect(cache.getOrSet('key', factory)).toBe('computed')
    expect(factory).toHaveBeenCalledOnce()
  })

  it('treats a stored undefined as present, so getOrSet does not recompute it', () => {
    const cache = createNodeCache()
    const factory = vi.fn(() => undefined)

    cache.getOrSet('key', factory)
    cache.getOrSet('key', factory)

    expect(factory).toHaveBeenCalledOnce()
  })
})
