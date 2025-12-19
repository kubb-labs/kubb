import { describe, expect, it } from 'vitest'
import { timeout } from './timeout.ts'

describe('timeout', () => {
  it('should return promise after timeout duration', async () => {
    const ok = await timeout(100)
    expect(ok).toBeTruthy()
  })
})
