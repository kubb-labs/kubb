import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spyOnConsole } from './console.mock.ts'
import { createAgentSession, disconnect, InvalidAgentTokenError, registerAgent } from './api.ts'

const consoleSpy = spyOnConsole()

// Partial: `api.ts` only wants the machine token stubbed, and a full factory would also replace
// the storage accessors that the rest of the package shares.
vi.mock('./machine.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./machine.ts')>()),
  getMachineToken: vi.fn(async () => 'machine-token-hash'),
}))

const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: vi.fn(async () => data),
})

const fetchMock = vi.fn()

const session = {
  sessionId: 'session-abc',
  slug: 'brave-otter',
  wsUrl: 'ws://localhost:3000/api/agent/sessions/session-abc/socket',
  expiresAt: new Date().toISOString(),
  revokedAt: null,
  isSandbox: false,
}

function forbiddenError(): Error {
  return Object.assign(new Error('Forbidden'), { statusCode: 403 })
}

function unauthorizedError(): Error {
  return Object.assign(new Error('invalid_agent_token'), { statusCode: 401 })
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.useFakeTimers()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('registerAgent', () => {
  it('throws instead of retrying when Studio rejects the token, so a deleted agent stops the loop', async () => {
    fetchMock.mockRejectedValue(unauthorizedError())

    await expect(registerAgent({ token: 'agent-token', studioUrl: 'http://localhost:3000' })).rejects.toBeInstanceOf(InvalidAgentTokenError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns true when registration succeeds on the first attempt', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    const promise = registerAgent({ token: 'tok', studioUrl: 'http://studio' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://studio/api/agent/connect',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    )
  })

  it('retries with backoff and returns true once an attempt succeeds', async () => {
    fetchMock.mockRejectedValueOnce(new Error('502')).mockRejectedValueOnce(new Error('502')).mockResolvedValueOnce(createMockResponse({}))

    const promise = registerAgent({ token: 'tok', studioUrl: 'http://studio' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('returns false when every attempt fails', async () => {
    fetchMock.mockRejectedValue(new Error('502'))

    const promise = registerAgent({ token: 'tok', studioUrl: 'http://studio' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})

describe('createAgentSession', () => {
  it('returns the session on success', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(session))

    await expect(createAgentSession({ token: 'tok', studioUrl: 'http://studio' })).resolves.toEqual(session)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws on a non-403 error without re-registering', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('Bad Gateway'), { statusCode: 502 }))

    await expect(createAgentSession({ token: 'tok', studioUrl: 'http://studio' })).rejects.toThrow('Failed to get agent session from Kubb Studio')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-registers and retries once when Studio rejects the machine token', async () => {
    // 1: session create → 403, 2: register → ok, 3: session create retry → ok
    fetchMock.mockRejectedValueOnce(forbiddenError()).mockResolvedValueOnce(createMockResponse({})).mockResolvedValueOnce(createMockResponse(session))

    const promise = createAgentSession({ token: 'tok', studioUrl: 'http://studio' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(session)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1]![0]).toBe('http://studio/api/agent/connect')
  })

  it('throws when re-registration fails after a machine token rejection', async () => {
    fetchMock.mockRejectedValue(forbiddenError())

    const promise = createAgentSession({ token: 'tok', studioUrl: 'http://studio' })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Failed to get agent session from Kubb Studio')
    // 1 session create + 4 register attempts
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })
})

describe('disconnect', () => {
  it('logs the slug when one is known', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    await disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio', slug: 'brave-otter' })

    expect(consoleSpy.log).toHaveBeenCalledWith('[brave-otter] Disconnected from Studio')
  })

  it('falls back to a generic tag when no slug is known', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    await disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio' })

    expect(consoleSpy.log).toHaveBeenCalledWith('[agent] Disconnected from Studio')
  })
})
