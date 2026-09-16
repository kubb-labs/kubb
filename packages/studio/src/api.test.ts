import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logLevel as logLevelMap } from '@kubb/core'
import { spyOnConsole } from './console.mock.ts'
import { createAgent, createAgentSession, createJob, disconnect, InvalidAgentTokenError, registerAgent, waitForJob } from './api.ts'

const consoleSpy = spyOnConsole()

// Partial: `api.ts` only wants the machine token stubbed, and a full factory would also replace
// the storage accessors that the rest of the package shares.
vi.mock('./machine.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./machine.ts')>()),
  getMachineToken: vi.fn(async () => 'machine-token-hash'),
}))

const createMockResponse = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

const fetchMock = vi.fn()

const session = {
  sessionId: 'session-abc',
  slug: 'brave-otter',
  wsUrl: 'ws://localhost:3000/api/agent/sessions/session-abc/socket',
  expiresAt: new Date().toISOString(),
  revokedAt: null,
  isSandbox: false,
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
    fetchMock.mockResolvedValue(createMockResponse({ message: 'invalid_agent_token' }, 401))

    await expect(registerAgent({ token: 'agent-token', studioUrl: 'http://localhost:3000' })).rejects.toBeInstanceOf(InvalidAgentTokenError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns true when registration succeeds on the first attempt', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    const promise = registerAgent({ token: 'tok', studioUrl: 'http://studio' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('http://studio/api/agent/connect')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok')
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
    fetchMock.mockResolvedValueOnce(createMockResponse({ message: 'Bad Gateway' }, 502))

    await expect(createAgentSession({ token: 'tok', studioUrl: 'http://studio' })).rejects.toThrow('Failed to get agent session from Kubb Studio: Bad Gateway')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('re-registers and retries once when Studio rejects the machine token', async () => {
    // 1: session create → 403, 2: register → ok, 3: session create retry → ok
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ message: 'machine token mismatch' }, 403))
      .mockResolvedValueOnce(createMockResponse({}))
      .mockResolvedValueOnce(createMockResponse(session))

    const promise = createAgentSession({ token: 'tok', studioUrl: 'http://studio' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(session)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1]![0]).toBe('http://studio/api/agent/connect')
  })

  it('throws when re-registration fails after a machine token rejection', async () => {
    fetchMock.mockResolvedValue(createMockResponse({ message: 'Forbidden' }, 403))

    const promise = createAgentSession({ token: 'tok', studioUrl: 'http://studio' })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('Failed to get agent session from Kubb Studio: Forbidden')
    // 1 session create + 1 register. A 403 is not retried: the machine token was refused, and
    // asking again with the same one cannot change that.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws InvalidAgentTokenError when the retry after re-register still gets a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ message: 'machine token mismatch' }, 403))
      .mockResolvedValueOnce(createMockResponse({}))
      .mockResolvedValueOnce(createMockResponse({ message: 'revoked' }, 401))

    const promise = createAgentSession({ token: 'tok', studioUrl: 'http://studio' })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toBeInstanceOf(InvalidAgentTokenError)
  })
})

describe('disconnect', () => {
  it('logs the slug when one is known', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    await disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio', slug: 'brave-otter', logLevel: logLevelMap.info })

    // console.error, not console.log: a CI runner only forwards a child process's stderr live.
    expect(consoleSpy.error).toHaveBeenCalledWith('[brave-otter] Disconnected from Studio')
  })

  it('falls back to a generic tag when no slug is known', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    await disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio', logLevel: logLevelMap.info })

    expect(consoleSpy.error).toHaveBeenCalledWith('[agent] Disconnected from Studio')
  })

  it('warns instead of throwing when Studio cannot be notified', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ message: 'gone' }, 500))

    await expect(
      disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio', slug: 'brave-otter', logLevel: logLevelMap.info }),
    ).resolves.toBeUndefined()

    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('[brave-otter] Failed to notify Studio of disconnection'))
  })

  it.each([400, 401, 403, 404, 409])('ignores a %s response', async (status) => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}, status))

    await expect(disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio', logLevel: logLevelMap.info })).resolves.toBeUndefined()
    expect(consoleSpy.warn).not.toHaveBeenCalled()
  })

  it('never logs when no logLevel is given, the silent default a library should have', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    await disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio', slug: 'brave-otter' })

    expect(consoleSpy.error).not.toHaveBeenCalled()
  })
})

describe('createAgent', () => {
  it('creates or reuses a CI agent and returns its token', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ id: 'agent-1', slug: 'brave-otter', name: 'acme/api#42', token: 'agent-token' }))

    await expect(createAgent({ studioUrl: 'http://studio', token: 'ci-token', name: 'acme/api#42', machineToken: 'machine-token-hash' })).resolves.toEqual({
      id: 'agent-1',
      slug: 'brave-otter',
      name: 'acme/api#42',
      token: 'agent-token',
    })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('http://studio/api/agents')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('x-api-key')).toBe('ci-token')
    expect(JSON.parse(String(init.body))).toEqual({ name: 'acme/api#42', machineToken: 'machine-token-hash' })
  })

  it('surfaces the upgrade link when the organization is at its agent limit', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ message: 'Agent limit reached', data: { upgradeUrl: 'http://studio/settings/billing' } }, 402))

    await expect(createAgent({ studioUrl: 'http://studio', token: 'ci-token', name: 'acme/api#42', machineToken: 'machine-token-hash' })).rejects.toThrow(
      'Agent limit reached; upgrade at http://studio/settings/billing.',
    )
  })
})

describe('createJob', () => {
  it('posts a snapshot job and returns the queued job', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ job: { id: 'job-1', status: 'queued' } }, 202))

    await expect(
      createJob({ studioUrl: 'http://studio', token: 'ci-token', type: 'snapshot', agentId: 'agent-1', name: '@kubb/demo', version: '1.0.0' }),
    ).resolves.toEqual({ id: 'job-1', status: 'queued' })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('http://studio/api/jobs')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('x-api-key')).toBe('ci-token')
    expect(JSON.parse(String(init.body))).toEqual({ type: 'snapshot', agentId: 'agent-1', name: '@kubb/demo', version: '1.0.0' })
  })
})

describe('waitForJob', () => {
  it('polls until the job succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ job: { id: 'job-1', status: 'running' } }))
      .mockResolvedValueOnce(createMockResponse({ job: { id: 'job-1', status: 'success', snapshot: { id: 'snap-1' } } }))

    const promise = waitForJob({ studioUrl: 'http://studio', token: 'ci-token', id: 'job-1' })

    await vi.advanceTimersByTimeAsync(6_000)

    await expect(promise).resolves.toEqual({ id: 'job-1', status: 'success', snapshot: { id: 'snap-1' } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('backs off instead of polling every second for the whole timeout', async () => {
    // A body reads once, so a shared Response would end the loop early.
    fetchMock.mockImplementation(() => Promise.resolve(createMockResponse({ job: { id: 'job-1', status: 'running' } })))

    const promise = waitForJob({ studioUrl: 'http://studio', token: 'ci-token', id: 'job-1', timeoutMs: 600_000 })
    const timedOut = expect(promise).rejects.toThrow('Timed out waiting for the Studio job')
    await vi.advanceTimersByTimeAsync(600_000)
    await timedOut

    // A one-second poll would have spent 600 against a budget of 100 per window.
    expect(fetchMock.mock.calls.length).toBeLessThan(30)
  })

  it('waits the interval Studio asks for when it answers 429', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { tryAgainIn: 30_000 } }, 429))
      .mockResolvedValueOnce(createMockResponse({ job: { id: 'job-1', status: 'success' } }))

    const promise = waitForJob({ studioUrl: 'http://studio', token: 'ci-token', id: 'job-1', timeoutMs: 600_000 })

    // The 2s poll is refused, so the next waits the 30s Studio asked for, not 4s.
    await vi.advanceTimersByTimeAsync(31_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)
    await expect(promise).resolves.toEqual({ id: 'job-1', status: 'success' })
  })
})
