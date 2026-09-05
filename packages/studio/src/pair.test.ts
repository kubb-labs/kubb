import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setTimeout as delay } from 'node:timers/promises'
import { PairingCanceledError, pollForPairingToken, startPairing, type PairingSession } from './pair.ts'

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
  })

  it('throws on an unexpected pairing error instead of spinning until expiry', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ error: 'server_error', error_description: 'pairing store unavailable' }, 500))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('pairing store unavailable')
  })

  it('throws when Studio returns an empty body', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(undefined, 500))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('empty pairing response')
  })

  it('falls back to a 5s interval instead of spinning when Studio omits it', async () => {
    const result = { token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }
    fetchMock.mockResolvedValueOnce(createMockResponse(result))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session: { ...session, interval: 0 } })
    await vi.runAllTimersAsync()
    await promise

    expect(delayMock).toHaveBeenCalledWith(5_000, undefined, { signal: undefined })
  })

  it('falls back to a 600s expiry instead of expiring before the first poll when Studio omits it', async () => {
    const result = { token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }
    fetchMock.mockResolvedValueOnce(createMockResponse(result))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session: { ...session, expires_in: 0 } })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
  })

  it('keeps polling when Studio is briefly unreachable', async () => {
    using warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = { token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }
    fetchMock.mockRejectedValueOnce(new Error('socket hang up')).mockResolvedValueOnce(createMockResponse(result))

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('socket hang up'))
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

  it('rejects with PairingCanceledError when the signal is already aborted before polling starts', async () => {
    const controller = new AbortController()
    controller.abort()

    const promise = pollForPairingToken({ studioUrl: 'http://studio', session, signal: controller.signal })

    await expect(promise).rejects.toBeInstanceOf(PairingCanceledError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects with PairingCanceledError when the signal aborts mid-request', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementationOnce(() => {
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
  it('requests a pairing session from Studio', async () => {
    const session = { device_code: 'device', user_code: 'ABCD-EFGH', verification_uri: 'https://kubb.studio/pair' }
    fetchMock.mockResolvedValueOnce(createMockResponse(session))

    await expect(startPairing({ studioUrl: 'http://studio', name: 'my-project', hostname: 'my-host' })).resolves.toMatchObject(session)
  })

  it('rejects with PairingCanceledError when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'))

    await expect(startPairing({ studioUrl: 'http://studio', name: 'my-project', hostname: 'my-host', signal: controller.signal })).rejects.toBeInstanceOf(
      PairingCanceledError,
    )
  })
})
