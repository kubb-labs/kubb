import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hash } from 'node:crypto'
import type { Storage } from 'unstorage'

// Silence the deliberate warning path so it does not pollute test output.
vi.spyOn(console, 'warn').mockImplementation(() => {})

const store = new Map<string, unknown>()
const mockStorage = {
  getItem: vi.fn(async (key: string) => store.get(key) ?? null),
  setItem: vi.fn(async (key: string, value: unknown) => {
    store.set(key, value)
  }),
}

// `token.ts` caches the fallback secret per module instance, so a "restart" means resetting
// modules. The storage module resets with it, hence re-installing the mock on every fresh import.
async function importFreshToken() {
  const { setStorage } = await import('./machine.ts')
  setStorage(mockStorage as unknown as Storage)

  const module = await import('./machine.ts')
  return module.getMachineToken
}

describe('getMachineToken', () => {
  const originalSecret = process.env.KUBB_AGENT_SECRET

  beforeEach(() => {
    delete process.env.KUBB_AGENT_SECRET
    store.clear()
    mockStorage.getItem.mockClear()
    mockStorage.setItem.mockClear()
    vi.resetModules()
  })

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.KUBB_AGENT_SECRET = originalSecret
    } else {
      delete process.env.KUBB_AGENT_SECRET
    }
  })

  it('returns a deterministic value derived from KUBB_AGENT_SECRET without touching storage', async () => {
    process.env.KUBB_AGENT_SECRET = 'my-secret'
    const getMachineToken = await importFreshToken()

    await expect(getMachineToken()).resolves.toBe(hash('sha256', 'my-secret'))
    expect(mockStorage.getItem).not.toHaveBeenCalled()
  })

  it('persists the generated fallback secret to storage on first use', async () => {
    const getMachineToken = await importFreshToken()

    await getMachineToken()

    expect(mockStorage.setItem).toHaveBeenCalledWith('machine-secret', expect.stringMatching(/^[a-f0-9]{64}$/))
  })

  it('returns the same token across restarts by reusing the persisted secret', async () => {
    const getMachineToken = await importFreshToken()
    const firstToken = await getMachineToken()

    // Simulate a process restart: fresh module state, same value in storage
    vi.resetModules()
    const freshGetMachineToken = await importFreshToken()

    await expect(freshGetMachineToken()).resolves.toBe(firstToken)
  })
})
