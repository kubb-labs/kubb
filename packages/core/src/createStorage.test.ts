import { describe, expect, it } from 'vitest'
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
})
