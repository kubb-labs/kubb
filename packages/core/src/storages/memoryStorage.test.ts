import { describe, expect, it } from 'vitest'
import { memoryStorage } from './memoryStorage.ts'

// The Storage contract shared with fsStorage lives in createStorage.test.ts.
describe('memoryStorage', () => {
  it('returns an independent store from each call', async () => {
    const a = memoryStorage()
    const b = memoryStorage()

    await a.writeItem('key', 'value-a')

    expect(await b.existsItem('key')).toBe(false)
  })

  it('returns all keys from readKeys when no base is given', async () => {
    const storage = memoryStorage()

    await storage.writeItem('src/gen/a.ts', '1')
    await storage.writeItem('src/gen/b.ts', '2')
    await storage.writeItem('other/c.ts', '3')

    expect((await storage.readKeys()).toSorted()).toStrictEqual(['other/c.ts', 'src/gen/a.ts', 'src/gen/b.ts'])
  })

  it('removes all keys on empty when no base is given', async () => {
    const storage = memoryStorage()

    await storage.writeItem('a', '1')
    await storage.writeItem('b', '2')
    await storage.empty()

    expect(await storage.readKeys()).toStrictEqual([])
  })
})
