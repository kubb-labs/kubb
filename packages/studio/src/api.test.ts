import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spyOnConsole } from './console.mock.ts'
import { createAgent, createJob, IncompatibleAgentError, InvalidAgentTokenError, registerAgent, waitForJob } from './api.ts'

const consoleSpy = spyOnConsole()

// Partial: `api.ts` only wants the machine token stubbed, and a full factory would also replace
// the storage accessors that the rest of the package shares.
vi.mock('./machine.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./machine.ts')>()),
  getMachineToken: vi.fn(async () => 'machine-token-hash'),
}))

const createMockResponse = (data: unknown, status = 200, headers?: Record<string, string>) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } })

const fetchMock = vi.fn()

const registration = { socketUrl: 'wss://studio/api/agent/socket', isSandbox: false, version: '1.0.0', agentSlug: 'brave-otter' }
const props = { token: 'tok', studioUrl: 'http://studio', instanceId: 'instance-1', capacity: { maxConcurrent: 1 } }

beforeEach(() => {
  fetchMock.mockReset()
  vi.useFakeTimers()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('registerAgent', () => {
  it('returns where to open the socket', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(registration))

    await expect(registerAgent(props)).resolves.toStrictEqual(registration)

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('http://studio/api/agent/connect')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok')
  })

  it('sends the machine token, the instance id, and the capacity', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(registration))

    await registerAgent({ ...props, capacity: { maxConcurrent: 1, memoryBudgetMb: 1024 } })

    expect(JSON.parse(String(fetchMock.mock.calls[0]![1].body))).toStrictEqual({
      machineToken: 'machine-token-hash',
      instanceId: 'instance-1',
      capacity: { maxConcurrent: 1, memoryBudgetMb: 1024 },
    })
  })

  it('retries a transient failure before giving up with the reason', async () => {
    // A fresh response each time: a body can only be read once, and the call is retried.
    fetchMock.mockImplementation(async () => createMockResponse({ message: 'maintenance' }, 503))

    const promise = registerAgent(props)
    const assertion = expect(promise).rejects.toThrow('Failed to register with Kubb Studio: maintenance')
    await vi.runAllTimersAsync()
    await assertion

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(consoleSpy.error).not.toHaveBeenCalled()
  })

  it('throws InvalidAgentTokenError on a rejected token, without retrying', async () => {
    fetchMock.mockResolvedValue(createMockResponse({ message: 'invalid token' }, 401))

    await expect(registerAgent(props)).rejects.toBeInstanceOf(InvalidAgentTokenError)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('throws IncompatibleAgentError when Studio needs a newer agent, without retrying', async () => {
    fetchMock.mockResolvedValue(createMockResponse({ message: 'agent 5.3.0 is below 5.4.0' }, 426))

    const error = await registerAgent(props).catch((thrown: unknown) => thrown)

    expect(error).toBeInstanceOf(IncompatibleAgentError)
    expect((error as Error).message).toContain('agent 5.3.0 is below 5.4.0')
    expect(fetchMock).toHaveBeenCalledOnce()
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

  it('retries a busy agent, honoring the Retry-After header, until it is queued', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ message: 'Agent is busy' }, 429, { 'Retry-After': '2' }))
      .mockResolvedValueOnce(createMockResponse({ job: { id: 'job-1', status: 'queued' } }, 202))

    const promise = createJob({ studioUrl: 'http://studio', token: 'ci-token', type: 'generation', agentId: 'agent-1' })
    await vi.advanceTimersByTimeAsync(2_000)

    await expect(promise).resolves.toEqual({ id: 'job-1', status: 'queued' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retries a full queue and a disconnected agent (409, 429, 503) without a Retry-After hint', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ message: 'conflict' }, 409))
      .mockResolvedValueOnce(createMockResponse({ message: 'Agent queue is full' }, 429))
      .mockResolvedValueOnce(createMockResponse({ message: 'Agent is offline' }, 503))
      .mockResolvedValueOnce(createMockResponse({ job: { id: 'job-1', status: 'queued' } }, 202))

    const promise = createJob({ studioUrl: 'http://studio', token: 'ci-token', type: 'generation', agentId: 'agent-1' })
    await vi.advanceTimersByTimeAsync(30_000)

    await expect(promise).resolves.toEqual({ id: 'job-1', status: 'queued' })
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('throws immediately on a non-retryable status such as a missing agent', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ message: 'Agent not found' }, 404))

    await expect(createJob({ studioUrl: 'http://studio', token: 'ci-token', type: 'generation', agentId: 'agent-1' })).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('gives up once the timeout passes, instead of retrying forever', async () => {
    fetchMock.mockResolvedValue(createMockResponse({ message: 'Agent is busy' }, 429))

    const promise = createJob({ studioUrl: 'http://studio', token: 'ci-token', type: 'generation', agentId: 'agent-1', timeoutMs: 5_000 })
    const assertion = expect(promise).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(5_000)
    await assertion

    expect(fetchMock.mock.calls.length).toBeGreaterThan(0)
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
