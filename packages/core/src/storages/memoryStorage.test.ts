import { describe, expect, it } from 'vitest'
import { memoryStorage } from './memoryStorage.ts'

describe('memoryStorage', () => {
  it('returns an independent store from each call', async () => {
    const a = memoryStorage()
    const b = memoryStorage()

    await a.writeItem('key', 'value-a')

    expect(await b.readItem('key')).toBeNull()
  })
})
