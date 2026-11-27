import { hash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setTimeout as delay } from 'node:timers/promises'
import { generateAgentKey, getAgentPublicKey, getTokenRefreshPayload, verifyAgentSignature } from './agentKey.ts'
import { InvalidAgentTokenError } from './connect.ts'
import { AgentSignatureContext } from './protocol.ts'
import {
  pairAgent,
  PairingCanceledError,
  PairingDeniedError,
  PairingCodeError,
  PairingExpiredError,
  pollForPairingToken,
  redeemPairingCode,
  refreshAgentToken,
  renewAgentToken,
  startPairing,
  type PairingSession,
} from './pair.ts'

vi.mock('node:timers/promises', () => ({
  setTimeout: vi.fn(async () => {}),
}))

const delayMock = vi.mocked(delay)

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

    const promise = pollForPairingToken({ studioUrl: 'https://studio.test', session })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
  })

  it("surfaces Studio's error_description on access_denied", async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ error: 'access_denied', error_description: 'agent limit reached' }, 403))

    const promise = pollForPairingToken({ studioUrl: 'https://studio.test', session })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('agent limit reached')
    await expect(promise).rejects.toBeInstanceOf(PairingDeniedError)
  })

  it.each(['expired_token', 'invalid_grant'])('throws PairingExpiredError on %s', async (error) => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ error }, 400))

    const promise = pollForPairingToken({ studioUrl: 'https://studio.test', session })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toBeInstanceOf(PairingExpiredError)
  })

  it.each([
    ['Studio is briefly unreachable', new Error('socket hang up'), 'socket hang up'],
    [
      'a proxy answers a deploy with a 5xx page instead of JSON',
      new Response('<html>Bad Gateway</html>', { status: 502 }),
      'Kubb Studio answered with status 502',
    ],
    ['Studio answers with a null JSON body', createMockResponse(null, 400), 'Kubb Studio answered with status 400'],
  ])('keeps polling when %s, and reports the miss through onRetry', async (_case, first, message) => {
    const onRetry = vi.fn()
    const result = { token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }
    fetchMock
      .mockImplementationOnce(() => (first instanceof Error ? Promise.reject(first) : Promise.resolve(first)))
      .mockResolvedValueOnce(createMockResponse(result))

    const promise = pollForPairingToken({ studioUrl: 'https://studio.test', session, onRetry })
    await vi.runAllTimersAsync()

    await expect(promise).resolves.toEqual(result)
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining(message) }))
  })

  it('rejects with PairingCanceledError when the signal aborts during the wait between polls', async () => {
    const controller = new AbortController()
    delayMock.mockImplementationOnce(() => {
      controller.abort()
      return Promise.reject(new Error('The operation was aborted'))
    })

    const promise = pollForPairingToken({ studioUrl: 'https://studio.test', session, signal: controller.signal })
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toBeInstanceOf(PairingCanceledError)
  })
})

describe('startPairing', () => {
  it.each([
    ['cli', { client_id: 'kubb-cli' }],
    ['user', { client_id: 'kubb-agent', agent_kind: 'user' }],
    ['sandbox', { client_id: 'kubb-agent', agent_kind: 'sandbox' }],
  ] as const)('sends the client id, the agent kind and the hashed machine id for a %s machine', async (type, client) => {
    fetchMock.mockResolvedValueOnce(createMockResponse(session))

    await startPairing({ studioUrl: 'https://studio.test', type, name: 'my-project', hostname: 'my-host', machineId: 'secret' })

    expect(JSON.parse(String(fetchMock.mock.calls[0]![1].body))).toStrictEqual({
      ...client,
      name: 'my-project',
      hostname: 'my-host',
      machine_token: hash('sha256', 'secret'),
    })
  })

  it('sends the public half of the agent key, and never the key itself', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse(session))
    const privateKey = generateAgentKey()

    await startPairing({ studioUrl: 'https://studio.test', type: 'cli', name: 'my-project', hostname: 'my-host', machineId: 'secret', privateKey })

    const body = String(fetchMock.mock.calls[0]![1].body)
    expect(JSON.parse(body)).toMatchObject({ public_key: getAgentPublicKey(privateKey) })
    expect(body).not.toContain('PRIVATE KEY')
  })

  it('rejects a response without a pairing code', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html></html>', { status: 200 }))

    await expect(startPairing({ studioUrl: 'https://studio.test', type: 'cli', name: 'my-project', hostname: 'my-host', machineId: 'secret' })).rejects.toThrow(
      'Kubb Studio returned no pairing code',
    )
  })
})

describe('pairAgent', () => {
  const result = { token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }
  const options = { studioUrl: 'https://studio.test', type: 'user', name: 'kubb-agent on box', hostname: 'box', machineId: 'secret' } as const

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

describe('refreshAgentToken', () => {
  const options = { studioUrl: 'https://studio.test', token: 'old-token', machineId: 'secret' }

  it('trades the bearer token and the machine secret for a new token', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ token: 'new-token' }))

    await expect(refreshAgentToken(options)).resolves.toBe('new-token')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://studio.test/api/agent/token/refresh')
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer old-token')
    expect(JSON.parse(String(init.body))).toStrictEqual({ machine_id: 'secret' })
  })

  it('adds a signature over the time and the token when the agent holds a key', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ token: 'new-token' }))
    const privateKey = generateAgentKey()

    await refreshAgentToken({ ...options, privateKey })

    const body = JSON.parse(String(fetchMock.mock.calls[0]![1].body))
    expect(body).toStrictEqual({ machine_id: 'secret', signed_at: Date.now(), signature: expect.any(String) })
    const payload = getTokenRefreshPayload({ token: 'old-token', signedAt: body.signed_at })
    const publicKey = getAgentPublicKey(privateKey)
    expect(verifyAgentSignature({ publicKey, context: AgentSignatureContext.TOKEN_REFRESH, payload, signature: body.signature })).toBe(true)
  })

  it.each([
    ['a Studio without the route', 404],
    ['an agent kind that does not refresh', 409],
  ])('returns null for %s (%i), so the host keeps its token', async (_case, status) => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ statusMessage: 'nope' }, status))

    await expect(refreshAgentToken(options)).resolves.toBeNull()
  })

  it('rejects with InvalidAgentTokenError when Studio refuses the token', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ statusMessage: 'Unauthorized' }, 401))

    await expect(refreshAgentToken(options)).rejects.toBeInstanceOf(InvalidAgentTokenError)
  })

  it.each([
    ['a server error', createMockResponse({}, 500), 'status 500'],
    ['an answer without a token', createMockResponse({}), 'without a token'],
  ])('rejects on %s', async (_case, response, message) => {
    fetchMock.mockResolvedValueOnce(response)

    await expect(refreshAgentToken(options)).rejects.toThrow(message)
  })

  it('gives up once the timeout passes', async () => {
    vi.useRealTimers()
    fetchMock.mockImplementationOnce(
      (_url, init: RequestInit) => new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))),
    )

    await expect(refreshAgentToken({ ...options, timeout: 20 })).rejects.toThrow('did not answer the token refresh within 20 ms')
  })
})

describe('renewAgentToken', () => {
  const options = { studioUrl: 'https://studio.test', token: 'old-token', machineId: 'secret' }

  it('resolves the lifetime of an expiring token', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ token: 'new-token', expires_in: 3600 }))

    await expect(renewAgentToken(options)).resolves.toStrictEqual({ token: 'new-token', expiresIn: 3600 })
  })

  it.each([undefined, 0, -5, 'soon'])('leaves out an expires_in of %j', async (expiresIn) => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ token: 'new-token', expires_in: expiresIn }))

    await expect(renewAgentToken(options)).resolves.toStrictEqual({ token: 'new-token' })
  })
})

describe('redeemPairingCode', () => {
  const pairingCode = `kubb_pair_${'a'.repeat(43)}`
  const privateKey = generateAgentKey()
  const options = { studioUrl: 'https://studio.test', pairingCode, name: 'my-project', machineId: 'secret', privateKey }
  const agent = { id: 'agent-1', slug: 'brave-otter', name: 'my-project' }

  it('sends the code, the hashed machine secret, the name and the raw public key, and resolves the token at once', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ token: 'agent-token', expires_in: 3600, agent }))

    await expect(redeemPairingCode(options)).resolves.toStrictEqual({ token: 'agent-token', expiresIn: 3600, agent })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://studio.test/api/agent/token')
    expect(init.method).toBe('POST')
    expect(init.redirect).toBe('error')
    const body = JSON.parse(String(init.body))
    expect(body).toStrictEqual({
      pairing_code: pairingCode,
      machine_token: hash('sha256', 'secret'),
      name: 'my-project',
      public_key: getAgentPublicKey(privateKey),
    })
    expect(body.public_key).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('assumes the one-hour lifetime when Studio sends none', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ token: 'agent-token', agent }))

    await expect(redeemPairingCode(options)).resolves.toMatchObject({ expiresIn: 3600 })
  })

  it.each([
    ['invalid_grant', 400, undefined, 'unknown, already used, or its connection was revoked'],
    ['invalid_grant', 400, 'The connection was revoked', 'The connection was revoked. Ask the MCP client for a new code.'],
    ['expired_token', 400, undefined, 'The pairing code expired'],
    ['access_denied', 403, 'The Free plan allows 5 MCP agents.', 'The Free plan allows 5 MCP agents.'],
    ['access_denied', 403, undefined, 'MCP agent limit'],
  ])('throws PairingCodeError on %s (%i, %j) and does not send the code again', async (error, status, description, message) => {
    fetchMock.mockResolvedValue(createMockResponse({ error, error_description: description }, status))

    const promise = redeemPairingCode(options)

    await expect(promise).rejects.toBeInstanceOf(PairingCodeError)
    await expect(promise).rejects.toMatchObject({ code: error })
    await expect(promise).rejects.toThrow(message)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it.each([
    ['a server error', createMockResponse({}, 502), 'status 502'],
    ['an answer without a token', createMockResponse({ agent }), 'status 200'],
    ['an answer without an agent', createMockResponse({ token: 'agent-token' }), 'status 200'],
  ])('rejects on %s without retrying', async (_case, response, message) => {
    fetchMock.mockResolvedValue(response)

    await expect(redeemPairingCode(options)).rejects.toThrow(message)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('keeps the code out of the error when Studio cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError(`fetch failed for ${pairingCode}`))

    const error = (await redeemPairingCode(options).catch((error: unknown) => error)) as Error

    expect(error.message).toContain('Could not reach Kubb Studio')
    expect(error.message).not.toContain(pairingCode)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('rejects with PairingCanceledError when the signal aborts', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementationOnce(async () => {
      controller.abort()
      throw new DOMException('aborted', 'AbortError')
    })

    await expect(redeemPairingCode({ ...options, signal: controller.signal })).rejects.toBeInstanceOf(PairingCanceledError)
  })
})

describe('redirects', () => {
  it('refuses a redirect on the pairing requests and the token refresh, which carry secrets', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse(session))
      .mockResolvedValueOnce(createMockResponse({ token: 'agent-token', agent: { id: '1', slug: 'brave-otter', name: 'demo' } }))
      .mockResolvedValueOnce(createMockResponse({ token: 'new-token' }))

    await startPairing({ studioUrl: 'https://studio.test', type: 'cli', name: 'my-project', hostname: 'my-host', machineId: 'secret' })
    const poll = pollForPairingToken({ studioUrl: 'https://studio.test', session })
    await vi.runAllTimersAsync()
    await poll
    await refreshAgentToken({ studioUrl: 'https://studio.test', token: 'old-token', machineId: 'secret' })

    expect(fetchMock.mock.calls.map(([, init]) => init.redirect)).toStrictEqual(['error', 'error', 'error'])
  })
})
