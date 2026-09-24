import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  url: 'ws://localhost:3000/api/agent/sessions/session-abc/socket',
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

  it('returns false when every attempt fails, and leaves reporting it to the caller', async () => {
    fetchMock.mockRejectedValue(new Error('502'))

    const promise = registerAgent({ token: 'tok', studioUrl: 'http://studio' })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(consoleSpy.error).not.toHaveBeenCalled()
  })
})

describe('createAgentSession', () => {
  it('returns the session on success', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(session))

    await expect(createAgentSession({ token: 'tok', studioUrl: 'http://studio' })).resolves.toEqual(session)
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
  it('returns true once Studio is notified, without printing anything', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({}))

    await expect(disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio' })).resolves.toBe(true)

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('http://studio/api/agent/sessions/session-abc/disconnect')
    expect(init.method).toBe('POST')
    expect(consoleSpy.error).not.toHaveBeenCalled()
  })

  it('returns false instead of throwing when Studio cannot be notified', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ message: 'gone' }, 500))

    await expect(disconnect({ sessionId: 'session-abc', token: 'tok', studioUrl: 'http://studio' })).resolves.toBe(false)
    expect(consoleSpy.warn).not.toHaveBeenCalled()
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
})

describe('createJob', () => {
  it('sends the commit a snapshot is built from', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ job: { id: 'job-1', status: 'queued' } }, 202))

    await createJob({
      studioUrl: 'http://studio',
      token: 'ci-token',
      type: 'snapshot',
      agentId: 'agent-1',
      name: '@kubb/demo',
      version: '1.0.0',
      commit: 'c4d7e10',
    })

    expect(JSON.parse(String(fetchMock.mock.calls[0]![1].body))).toMatchObject({ commit: 'c4d7e10' })
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
})
