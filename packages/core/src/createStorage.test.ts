import { describe, expect, it, vi } from 'vitest'
import { createStorage } from './createStorage.ts'

function createMapStorage(map: Map<string, string>) {
  return {
    name: 'memory',
    async existsItem(key: string) {
      return map.has(key)
    },
    async readItem(key: string) {
      return map.get(key) ?? null
    },
    async writeItem(key: string, value: string) {
      map.set(key, value)
    },
    async removeItem(key: string) {
      map.delete(key)
    },
    async readKeys() {
      return [...map.keys()]
    },
    async empty() {
      map.clear()
    },
  }
}

describe('createStorage', () => {
  it('returns a callable that invokes the builder with provided options', () => {
    const factory = createStorage((options: { prefix: string }) => ({
      ...createMapStorage(new Map()),
      name: `custom-${options.prefix}`,
    }))

    const storage = factory({ prefix: 'test' })

    expect(storage.name).toBe('custom-test')
  })

  it('uses empty object when options are omitted', () => {
    const factory = createStorage((_options: Record<string, never>) => ({
      ...createMapStorage(new Map()),
      name: 'no-options',
    }))

    expect(() => factory()).not.toThrow()
    expect(factory().name).toBe('no-options')
  })

  it('fulfils the Storage interface contract', async () => {
    const map = new Map<string, string>()
    const storage = createStorage((_options: Record<string, never>) => createMapStorage(map))()

    await storage.writeItem('a', '1')
    await storage.writeItem('b', '2')

    expect(await storage.existsItem('a')).toBe(true)
    expect(await storage.readItem('a')).toBe('1')
    expect(await storage.readKeys()).toStrictEqual(['a', 'b'])

    await storage.removeItem('a')
    expect(await storage.existsItem('a')).toBe(false)

    await storage.empty()
    expect(await storage.readKeys()).toStrictEqual([])
  })

  it('writes the factory result when ensureItem is called on a missing key', async () => {
    const map = new Map<string, string>()
    const storage = createStorage((_options: Record<string, never>) => createMapStorage(map))()

    expect(await storage.ensureItem('a', () => 'computed')).toBe('computed')
    expect(map.get('a')).toBe('computed')
  })

  it('returns the stored value from ensureItem without running the factory', async () => {
    const map = new Map<string, string>([['a', 'stored']])
    const storage = createStorage((_options: Record<string, never>) => createMapStorage(map))()
    const factory = vi.fn(() => 'computed')

    expect(await storage.ensureItem('a', factory)).toBe('stored')
    expect(factory).not.toHaveBeenCalled()
  })

  it('treats a stored empty string as present, so ensureItem does not overwrite it', async () => {
    const map = new Map<string, string>([['a', '']])
    const storage = createStorage((_options: Record<string, never>) => createMapStorage(map))()
    const factory = vi.fn(() => 'computed')

    expect(await storage.ensureItem('a', factory)).toBe('')
    expect(factory).not.toHaveBeenCalled()
  })

  it('awaits an async factory before writing', async () => {
    const map = new Map<string, string>()
    const storage = createStorage((_options: Record<string, never>) => createMapStorage(map))()

    expect(await storage.ensureItem('a', async () => 'computed')).toBe('computed')
    expect(map.get('a')).toBe('computed')
  })

  it('keeps an ensureItem supplied by the builder', async () => {
    const ensureItem = vi.fn(async () => 'native')
    const storage = createStorage((_options: Record<string, never>) => ({
      ...createMapStorage(new Map()),
      ensureItem,
    }))()

    expect(await storage.ensureItem('a', () => 'computed')).toBe('native')
    expect(ensureItem).toHaveBeenCalledOnce()
  })
})
