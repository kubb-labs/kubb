import { describe, expect, it } from 'vitest'
import { defineStorage } from './defineStorage.ts'

describe('defineStorage', () => {
  it('returns a callable that invokes the builder with provided options', () => {
    const factory = defineStorage((options: { prefix: string }) => ({
      name: `custom-${options.prefix}`,
      async hasItem() { return false },
      async getItem() { return null },
      async setItem() {},
      async removeItem() {},
      async getKeys() { return [] },
      async clear() {},
    }))

    const storage = factory({ prefix: 'test' })

    expect(storage.name).toBe('custom-test')
  })

  it('uses empty object when options are omitted', () => {
    const factory = defineStorage((_options: Record<string, never>) => ({
      name: 'no-options',
      async hasItem() { return false },
      async getItem() { return null },
      async setItem() {},
      async removeItem() {},
      async getKeys() { return [] },
      async clear() {},
    }))

    expect(() => factory()).not.toThrow()
    expect(factory().name).toBe('no-options')
  })

  it('fulfils the DefineStorage interface contract', async () => {
    const map = new Map<string, string>()

    const factory = defineStorage((_options: Record<string, never>) => ({
      name: 'memory',
      async hasItem(key: string) { return map.has(key) },
      async getItem(key: string) { return map.get(key) ?? null },
      async setItem(key: string, value: string) { map.set(key, value) },
      async removeItem(key: string) { map.delete(key) },
      async getKeys() { return [...map.keys()] },
      async clear() { map.clear() },
    }))

    const storage = factory()

    await storage.setItem('a', '1')
    await storage.setItem('b', '2')

    expect(await storage.hasItem('a')).toBe(true)
    expect(await storage.getItem('a')).toBe('1')
    expect(await storage.getKeys()).toEqual(['a', 'b'])

    await storage.removeItem('a')
    expect(await storage.hasItem('a')).toBe(false)

    await storage.clear()
    expect(await storage.getKeys()).toEqual([])
  })
})
