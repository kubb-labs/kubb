import { describe, expect, it } from 'vitest'
import { memoryStorage } from './memoryStorage.ts'

describe('memoryStorage', () => {
  it('returns a storage with name "memory"', () => {
    expect(memoryStorage().name).toBe('memory')
  })

  it('each call returns an independent store', async () => {
    const a = memoryStorage()
    const b = memoryStorage()

    await a.setItem('key', 'value-a')

    expect(await b.hasItem('key')).toBe(false)
  })

  it('setItem and getItem round-trip', async () => {
    const storage = memoryStorage()

    await storage.setItem('src/gen/api.ts', 'export const x = 1')

    expect(await storage.getItem('src/gen/api.ts')).toBe('export const x = 1')
  })

  it('getItem returns null for a missing key', async () => {
    expect(await memoryStorage().getItem('missing')).toBeNull()
  })

  it('hasItem returns false before write and true after', async () => {
    const storage = memoryStorage()

    expect(await storage.hasItem('a')).toBe(false)
    await storage.setItem('a', '1')
    expect(await storage.hasItem('a')).toBe(true)
  })

  it('removeItem deletes an existing key', async () => {
    const storage = memoryStorage()

    await storage.setItem('a', '1')
    await storage.removeItem('a')

    expect(await storage.hasItem('a')).toBe(false)
  })

  it('removeItem does nothing for a missing key', async () => {
    await expect(memoryStorage().removeItem('ghost')).resolves.toBeUndefined()
  })

  it('getKeys returns all keys when no base is given', async () => {
    const storage = memoryStorage()

    await storage.setItem('src/gen/a.ts', '1')
    await storage.setItem('src/gen/b.ts', '2')
    await storage.setItem('other/c.ts', '3')

    expect((await storage.getKeys()).sort()).toEqual(['other/c.ts', 'src/gen/a.ts', 'src/gen/b.ts'])
  })

  it('getKeys filters by base prefix', async () => {
    const storage = memoryStorage()

    await storage.setItem('src/gen/a.ts', '1')
    await storage.setItem('src/gen/b.ts', '2')
    await storage.setItem('other/c.ts', '3')

    expect((await storage.getKeys('src/gen')).sort()).toEqual(['src/gen/a.ts', 'src/gen/b.ts'])
  })

  it('clear with no base removes all keys', async () => {
    const storage = memoryStorage()

    await storage.setItem('a', '1')
    await storage.setItem('b', '2')
    await storage.clear()

    expect(await storage.getKeys()).toEqual([])
  })

  it('clear with base removes only matching keys', async () => {
    const storage = memoryStorage()

    await storage.setItem('src/gen/a.ts', '1')
    await storage.setItem('src/gen/b.ts', '2')
    await storage.setItem('other/c.ts', '3')

    await storage.clear('src/gen')

    expect(await storage.getKeys()).toEqual(['other/c.ts'])
  })
})
