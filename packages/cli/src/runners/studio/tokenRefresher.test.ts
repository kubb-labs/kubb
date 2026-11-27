import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renewAgentToken } from '@kubb/studio'
import { updateCredentials } from './credentials.ts'
import type { Credentials } from './credentials.ts'
import { REFRESH_WINDOW, startTokenRefresher, type TokenRefresherOptions } from './tokenRefresher.ts'

vi.mock('@kubb/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kubb/studio')>()),
  renewAgentToken: vi.fn(),
}))
vi.mock('./credentials.ts', () => ({
  getMachineId: vi.fn(async () => 'machine-secret'),
  updateCredentials: vi.fn(async () => undefined),
}))

const HOUR_MS = 60 * 60 * 1000

function setup({ credentials: initial, random = () => 0 }: { credentials: Partial<Credentials>; random?: () => number }) {
  vi.spyOn(Math, 'random').mockImplementation(random)
  let credentials: Credentials = { studioUrl: 'https://studio.test', token: 'token-0', agentId: 'id', agentSlug: 'slug', ...initial }
  const warn = vi.fn()
  const controller = new AbortController()
  const options: TokenRefresherOptions = {
    studioUrl: 'https://studio.test',
    signal: controller.signal,
    warn,
    credentials: {
      get: () => credentials,
      set: (next) => {
        credentials = next
      },
    },
  }
  return { options, warn, controller, current: () => credentials }
}

const mcpToken = (issuedAt = Date.now()) => ({ issuedAt: new Date(issuedAt).toISOString(), expiresAt: new Date(issuedAt + HOUR_MS).toISOString() })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('TokenRefresher', () => {
  it.each([
    [0, REFRESH_WINDOW.min],
    [0.5, (REFRESH_WINDOW.min + REFRESH_WINDOW.max) / 2],
    [0.9999, REFRESH_WINDOW.max],
  ])('refreshes an expiring token at its jittered point (random %d)', async (random, share) => {
    const { options } = setup({ credentials: mcpToken(), random: () => random })
    vi.mocked(renewAgentToken).mockResolvedValue({ token: 'token-1', expiresIn: 3600 })
    const refresher = await startTokenRefresher(options)

    expect(renewAgentToken).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(Math.ceil(HOUR_MS * share) - 1_000)
    expect(renewAgentToken).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(renewAgentToken).toHaveBeenCalledOnce()
    refresher.stop()
  })

  it('schedules the next refresh from the new expires_in, not from a fixed interval', async () => {
    const { options, current } = setup({ credentials: mcpToken() })
    vi.mocked(renewAgentToken).mockResolvedValueOnce({ token: 'token-1', expiresIn: 600 }).mockResolvedValueOnce({ token: 'token-2', expiresIn: 600 })
    const refresher = await startTokenRefresher(options)

    await vi.advanceTimersByTimeAsync(HOUR_MS * REFRESH_WINDOW.min)
    expect(current()).toMatchObject({ token: 'token-1', expiresAt: new Date(Date.now() + 600_000).toISOString() })

    // The new token lasts 10 minutes, so it is refreshed at 7 minutes.
    await vi.advanceTimersByTimeAsync(600_000 * REFRESH_WINDOW.min - 1_000)
    expect(renewAgentToken).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(renewAgentToken).toHaveBeenCalledTimes(2)
    expect(current().token).toBe('token-2')
    refresher.stop()
  })

  it('picks a new jitter for each token', async () => {
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(1)
    const { options } = setup({ credentials: mcpToken(), random })
    vi.mocked(renewAgentToken).mockResolvedValue({ token: 'token-1', expiresIn: 3600 })
    const refresher = await startTokenRefresher(options)

    await vi.advanceTimersByTimeAsync(HOUR_MS * REFRESH_WINDOW.min)
    expect(renewAgentToken).toHaveBeenCalledOnce()
    // The new token drew the top of the window, so it waits 85 percent of its hour.
    await vi.advanceTimersByTimeAsync(HOUR_MS * REFRESH_WINDOW.max - 1_000)
    expect(renewAgentToken).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(renewAgentToken).toHaveBeenCalledTimes(2)
    refresher.stop()
  })

  it('retries a failed refresh well before the token expires, and warns', async () => {
    const { options, warn, current } = setup({ credentials: mcpToken() })
    vi.mocked(renewAgentToken).mockRejectedValueOnce(new Error('Studio is down')).mockResolvedValueOnce({ token: 'token-1', expiresIn: 3600 })
    const refresher = await startTokenRefresher(options)

    await vi.advanceTimersByTimeAsync(HOUR_MS * REFRESH_WINDOW.min)
    expect(warn).toHaveBeenCalledWith('Could not refresh the agent token: Studio is down')
    expect(current().token).toBe('token-0')

    await vi.advanceTimersByTimeAsync(60_000)
    expect(renewAgentToken).toHaveBeenCalledTimes(2)
    expect(current().token).toBe('token-1')
    refresher.stop()
  })

  it('refreshes an expiring token at once when it is already due', async () => {
    const { options } = setup({ credentials: mcpToken(Date.now() - 0.9 * HOUR_MS) })
    vi.mocked(renewAgentToken).mockResolvedValue({ token: 'token-1', expiresIn: 3600 })

    const refresher = await startTokenRefresher(options)

    expect(renewAgentToken).toHaveBeenCalledOnce()
    refresher.stop()
  })

  it('keeps refreshing a token without an expiry once a day, and drops a stale expiry', async () => {
    const { options, current } = setup({ credentials: { issuedAt: new Date().toISOString() } })
    vi.mocked(renewAgentToken).mockResolvedValue({ token: 'token-1' })
    const refresher = await startTokenRefresher(options)

    await vi.advanceTimersByTimeAsync(24 * HOUR_MS - 1_000)
    expect(renewAgentToken).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(renewAgentToken).toHaveBeenCalledOnce()
    expect(current().expiresAt).toBeUndefined()
    refresher.stop()
  })

  it('keeps renewing while a credential write is pending, and writes the tokens in order', async () => {
    const { options, current } = setup({ credentials: mcpToken() })
    let finishFirstWrite: () => void = () => {}
    const writes: Array<string> = []
    vi.mocked(updateCredentials)
      .mockImplementationOnce(async (update) => {
        await new Promise<void>((resolve) => {
          finishFirstWrite = resolve
        })
        writes.push(update({ ...current(), token: 'token-0' })?.token ?? 'skipped')
        return undefined
      })
      .mockImplementationOnce(async (update) => {
        writes.push(update({ ...current(), token: 'token-1' })?.token ?? 'skipped')
        return undefined
      })
    vi.mocked(renewAgentToken).mockResolvedValueOnce({ token: 'token-1', expiresIn: 600 }).mockResolvedValueOnce({ token: 'token-2', expiresIn: 600 })
    const refresher = await startTokenRefresher(options)

    await vi.advanceTimersByTimeAsync(HOUR_MS * REFRESH_WINDOW.min)
    // The first write is still waiting, as on a keychain prompt, yet the next renewal runs on time.
    await vi.advanceTimersByTimeAsync(600_000 * REFRESH_WINDOW.min)
    expect(renewAgentToken).toHaveBeenCalledTimes(2)
    expect(current().token).toBe('token-2')
    expect(writes).toStrictEqual([])

    finishFirstWrite()
    await refresher.written()
    expect(writes).toStrictEqual(['token-1', 'token-2'])
    refresher.stop()
  })

  it('stores the next token when the write before it failed', async () => {
    const { options, warn } = setup({ credentials: mcpToken() })
    // Disk keeps token-0 until a write succeeds.
    let stored: Credentials = { studioUrl: 'https://studio.test', token: 'token-0', agentId: 'id', agentSlug: 'slug' }
    vi.mocked(updateCredentials)
      .mockRejectedValueOnce(new Error('keychain locked'))
      .mockImplementationOnce(async (update) => {
        const next = update(stored)
        if (next) stored = next
        return next
      })
    vi.mocked(renewAgentToken).mockResolvedValueOnce({ token: 'token-1', expiresIn: 600 }).mockResolvedValueOnce({ token: 'token-2', expiresIn: 600 })
    const refresher = await startTokenRefresher(options)

    await vi.advanceTimersByTimeAsync(HOUR_MS * REFRESH_WINDOW.min)
    await refresher.written()
    expect(warn).toHaveBeenCalledWith('Could not store the refreshed token: keychain locked')
    expect(stored.token).toBe('token-0')

    await vi.advanceTimersByTimeAsync(600_000 * REFRESH_WINDOW.min)
    await refresher.written()
    expect(stored.token).toBe('token-2')
    refresher.stop()
  })

  it('starts without waiting for the first write', async () => {
    const { options } = setup({ credentials: mcpToken(Date.now() - 0.9 * HOUR_MS) })
    vi.mocked(updateCredentials).mockImplementationOnce(() => new Promise(() => {}))
    vi.mocked(renewAgentToken).mockResolvedValue({ token: 'token-1', expiresIn: 3600 })

    const refresher = await startTokenRefresher(options)

    expect(renewAgentToken).toHaveBeenCalledOnce()
    refresher.stop()
  })

  it('stops scheduling once stopped', async () => {
    const { options } = setup({ credentials: mcpToken() })
    const refresher = await startTokenRefresher(options)
    refresher.stop()

    await vi.advanceTimersByTimeAsync(2 * HOUR_MS)

    expect(renewAgentToken).not.toHaveBeenCalled()
  })
})
