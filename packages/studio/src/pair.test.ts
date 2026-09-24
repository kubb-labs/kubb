import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setTimeout as delay } from 'node:timers/promises'
import { pairAgent, PairingCanceledError, PairingDeniedError, PairingExpiredError, pollForPairingToken, startPairing, type PairingSession } from './pair.ts'

vi.mock('node:timers/promises', () => ({
  setTimeout: vi.fn(async () => {}),
}))

const delayMock = vi.mocked(delay)

vi.mock('./machine.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./machine.ts')>()),
  getMachineToken: vi.fn(async () => 'machine-token-hash'),
}))

const fetchMock = vi.fn()

const session: PairingSession = {
  device_code: 'device',
  user_code: 'ABCD-EFGH',
  verification_uri: 'https://kubb.studio/pair',
  verification_uri_complete: 'https://kubb.studio/pair?user_code=ABCD-EFGH',
  expires_in: 60,
  interval: 1,
}

const createMockResponse = (data: unknown, status = 200) =>
  new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  fetchMock.mockReset()
  vi.useFakeTimers()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('pollForPairingToken', () => {
  it('returns the token once Studio approves', async () => {
    const result = {
      token: 'agent-token',
      agent: { id: '1', slug: 'brave-otter', name: 'demo' },
    }
    fetchMock.mockResolvedValueOnce(createMockResponse({ error: 'authorization_pending' }, 400)).mockResolvedValueOnce(createMockResponse(result))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
  })

  it("surfaces Studio's error_description on access_denied", async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ error: 'access_denied', error_description: 'agent limit reached' }, 403))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('agent limit reached')
    await expect(promise).rejects.toBeInstanceOf(PairingDeniedError)
  })

  it.each(['expired_token', 'invalid_grant'])('throws PairingExpiredError on %s', async (error) => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ error }, 400))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toBeInstanceOf(PairingExpiredError)
  })

  it('keeps polling when Studio is briefly unreachable, and reports each miss through onRetry', async () => {
    using warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onRetry = vi.fn()
    const result = { token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }
    fetchMock.mockRejectedValueOnce(new Error('socket hang up')).mockResolvedValueOnce(createMockResponse(result))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session, onRetry })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('socket hang up') }))
    expect(warn).not.toHaveBeenCalled()
  })

  it('rejects with PairingCanceledError when the signal aborts during the wait between polls', async () => {
    const controller = new AbortController()
    delayMock.mockImplementationOnce(() => {
      controller.abort()
      return Promise.reject(new Error('The operation was aborted'))
    })

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session, signal: controller.signal })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toBeInstanceOf(PairingCanceledError)
  })
})

describe('startPairing', () => {
  it('pairs a cli machine as the kubb-cli client, with no agent kind', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(session))

    await startPairing({ studioUrl: 'http://studio', type: 'cli', name: 'my-project', hostname: 'my-host' })

    const body = JSON.parse(String(fetchMock.mock.calls[0]![1].body))
    expect(body).toMatchObject({ client_id: 'kubb-cli', machine_token: 'machine-token-hash' })
    expect(body).not.toHaveProperty('agent_kind')
  })

  it.each(['user', 'sandbox'] as const)('pairs a %s agent as the kubb-agent client with that kind', async (type) => {
    fetchMock.mockResolvedValueOnce(createMockResponse(session))

    await startPairing({ studioUrl: 'http://studio', type, name: 'kubb-agent on box', hostname: 'box' })

    expect(JSON.parse(String(fetchMock.mock.calls[0]![1].body))).toMatchObject({ client_id: 'kubb-agent', agent_kind: type })
  })
})

describe('pairAgent', () => {
  const result = { token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }
  const options = { studioUrl: 'http://studio', type: 'user', name: 'kubb-agent on box', hostname: 'box' } as const

  it('hands the code to the host, then returns the approved token', async () => {
    const onCode = vi.fn()
    fetchMock.mockResolvedValueOnce(createMockResponse(session)).mockResolvedValueOnce(createMockResponse(result))

    const promise = pairAgent({ ...options, onCode })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
    expect(onCode).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ user_code: 'ABCD-EFGH' }), 1)
  })

  it('asks for a fresh code when one expires, up to maxAttempts', async () => {
    const onCode = vi.fn()
    fetchMock
      .mockResolvedValueOnce(createMockResponse(session))
      .mockResolvedValueOnce(createMockResponse({ error: 'expired_token' }, 400))
      .mockResolvedValueOnce(createMockResponse({ ...session, user_code: 'WXYZ-1234' }))
      .mockResolvedValueOnce(createMockResponse(result))

    const promise = pairAgent({ ...options, onCode, maxAttempts: 2 })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
    expect(onCode).toHaveBeenNthCalledWith(2, expect.objectContaining({ user_code: 'WXYZ-1234' }), 2)
  })

  it('never asks for a new code after a denial', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(session)).mockResolvedValueOnce(createMockResponse({ error: 'access_denied' }, 403))

    const promise = pairAgent({ ...options, onCode: vi.fn(), maxAttempts: 5 })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toBeInstanceOf(PairingDeniedError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
