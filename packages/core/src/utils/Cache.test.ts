import { describe, expect, test } from 'vitest'
import { Cache } from './Cache.ts'

describe('Cache', () => {
  test('should set and get values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    const value = await cache.get('key1')
    expect(value).toBe('value1')
  })

  test('should return null for non-existent keys', async () => {
    const cache = new Cache<string>()
    const value = await cache.get('nonexistent')
    expect(value).toBeNull()
  })

  test('should delete values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.delete('key1')
    const value = await cache.get('key1')
    expect(value).toBeNull()
  })

  test('should clear all values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.set('key2', 'value2')
    await cache.clear()
    const value1 = await cache.get('key1')
    const value2 = await cache.get('key2')
    expect(value1).toBeNull()
    expect(value2).toBeNull()
  })

  test('should return all keys', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.set('key2', 'value2')
    const keys = await cache.keys()
    expect(keys).toEqual(['key1', 'key2'])
  })

  test('should return all values', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.set('key2', 'value2')
    const values = await cache.values()
    expect(values).toEqual(['value1', 'value2'])
  })

  test('should flush (no-op for base cache)', async () => {
    const cache = new Cache<string>()
    await cache.set('key1', 'value1')
    await cache.flush()
    const value = await cache.get('key1')
    expect(value).toBe('value1')
  })
})
