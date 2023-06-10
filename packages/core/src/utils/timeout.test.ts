import { timeout } from './timeout.ts'

describe('timeout', () => {
  test('if timeout returns promise after 1s', async () => {
    const ok = await timeout(100)
    expect(ok).toBeTruthy()
  })
})
