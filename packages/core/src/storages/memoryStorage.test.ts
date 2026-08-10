import { describe, expect, it } from 'vitest'
import { memoryStorage } from './memoryStorage.ts'

describe('memoryStorage', () => {
  it('returns a storage with name "memory"', () => {
    expect(memoryStorage().name).toBe('memory')
  })

  it('each call returns an independent store', async () => {
    const a = memoryStorage()
    const b = memoryStorage()

    await a.writeItem('key', 'value-a')

    expect(await b.existsItem('key')).toBe(false)
  })

  it('writeItem and readItem round-trip', async () => {
    const storage = memoryStorage()

    await storage.writeItem('src/gen/api.ts', 'export const x = 1')

    expect(await storage.readItem('src/gen/api.ts')).toBe('export const x = 1')
  })

  it('readItem returns null for a missing key', async () => {
    expect(await memoryStorage().readItem('missing')).toBeNull()
  })

  it('existsItem returns false before write and true after', async () => {
    const storage = memoryStorage()

    expect(await storage.existsItem('a')).toBe(false)
    await storage.writeItem('a', '1')
    expect(await storage.existsItem('a')).toBe(true)
  })

  it('removeItem deletes an existing key', async () => {
    const storage = memoryStorage()

    await storage.writeItem('a', '1')
    await storage.removeItem('a')

    expect(await storage.existsItem('a')).toBe(false)
  })

  it('removeItem does nothing for a missing key', async () => {
    await expect(memoryStorage().removeItem('ghost')).resolves.toBeUndefined()
  })

  it('readKeys returns all keys when no base is given', async () => {
    const storage = memoryStorage()

    await storage.writeItem('src/gen/a.ts', '1')
    await storage.writeItem('src/gen/b.ts', '2')
    await storage.writeItem('other/c.ts', '3')

    expect((await storage.readKeys()).sort()).toStrictEqual(['other/c.ts', 'src/gen/a.ts', 'src/gen/b.ts'])
  })

  it('readKeys filters by base prefix', async () => {
    const storage = memoryStorage()

    await storage.writeItem('src/gen/a.ts', '1')
    await storage.writeItem('src/gen/b.ts', '2')
    await storage.writeItem('other/c.ts', '3')

    expect((await storage.readKeys('src/gen')).sort()).toStrictEqual(['src/gen/a.ts', 'src/gen/b.ts'])
  })

  it('clear with no base removes all keys', async () => {
    const storage = memoryStorage()

    await storage.writeItem('a', '1')
    await storage.writeItem('b', '2')
    await storage.empty()

    expect(await storage.readKeys()).toStrictEqual([])
  })

  it('clear with base removes only matching keys', async () => {
    const storage = memoryStorage()

    await storage.writeItem('src/gen/a.ts', '1')
    await storage.writeItem('src/gen/b.ts', '2')
    await storage.writeItem('other/c.ts', '3')

    await storage.empty('src/gen')

    expect(await storage.readKeys()).toStrictEqual(['other/c.ts'])
  })
})
