import { describe, expect, it } from 'vitest'
import { memoryCache } from './memoryCache.ts'

describe('memoryCache', () => {
  it('restores a persisted snapshot', async () => {
    const cache = memoryCache()
    const snapshot = { files: { 'pet.ts': 'export type Pet = {}' } }
    await cache.persist({ key: 'abc', snapshot })
    expect(await cache.restore({ key: 'abc' })).toStrictEqual(snapshot)
  })

  it('returns null on a miss', async () => {
    expect(await memoryCache().restore({ key: 'missing' })).toBeNull()
  })
})
