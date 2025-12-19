import { Cache } from './Cache.ts'

describe('Cache', () => {
  it('should set and get values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    const value = await cache.get('key1')
    expect(value).toBe('value1')
  })

  it('should return null for non-existent keys', async () => {
    const cache = new Cache<string>()
    const value = await cache.get('nonexistent')
    expect(value).toBeNull()
  })

  it('should delete values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.delete('key1')
    const value = await cache.get('key1')
    expect(value).toBeNull()
  })

  it('should clear all values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.set('key2', 'value2')
    await cache.clear()
    const value1 = await cache.get('key1')
    const value2 = await cache.get('key2')
    expect(value1).toBeNull()
    expect(value2).toBeNull()
  })

  it('should return all keys', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.set('key2', 'value2')
    const keys = await cache.keys()
    expect(keys).toEqual(['key1', 'key2'])
  })

  it('should return all values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.set('key2', 'value2')
    const values = await cache.values()
    expect(values).toEqual(['value1', 'value2'])
  })

  it('should flush (no-op for base cache)', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.flush()
    const value = await cache.get('key1')
    expect(value).toBe('value1')
  })
})
