import { timeout } from './timeout.ts'
import { describe, expect, it } from 'vitest'


describe('timeout', () => {
  it('should return promise after timeout duration', async () => {
    const ok = await timeout(100)
    expect(ok).toBeTruthy()
  })
})
