import { spawnSync } from 'node:child_process'
import { describe, expect, it, vi } from 'vitest'
import { verifyPackage } from './verifyRegistry.mjs'

// node:child_process is a built-in with non-configurable exports, so vi.spyOn
// can't patch it directly in real ESM. vi.mock is the only way to replace it;
// each test still owns its own return-value sequence via mockReturnValueOnce,
// so there's no shared state or beforeEach reset needed between tests.
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))

const pkg = { name: '@kubb/core', version: '5.0.0-beta.81' }

function mockView(results) {
  const mocked = vi.mocked(spawnSync)
  mocked.mockClear()
  for (const result of results) mocked.mockReturnValueOnce(result)
  return mocked
}

const live = { status: 0, stdout: JSON.stringify({ version: pkg.version }) }
const missing = { status: 1, stdout: '' }

describe('verifyPackage', () => {
  it('returns true when the version is live on the first attempt', async () => {
    const mocked = mockView([live])

    await expect(verifyPackage({ pkg, attempts: 3, delayMs: 0 })).resolves.toBe(true)
    expect(mocked).toHaveBeenCalledTimes(1)
  })

  it('retries until the version shows up on the registry', async () => {
    const mocked = mockView([missing, missing, live])

    await expect(verifyPackage({ pkg, attempts: 5, delayMs: 0 })).resolves.toBe(true)
    expect(mocked).toHaveBeenCalledTimes(3)
  })

  it('returns false after exhausting every attempt', async () => {
    const mocked = mockView([missing, missing])

    await expect(verifyPackage({ pkg, attempts: 2, delayMs: 0 })).resolves.toBe(false)
    expect(mocked).toHaveBeenCalledTimes(2)
  })
})
