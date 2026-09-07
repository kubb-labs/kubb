import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { InvalidAgentTokenError } from './api.ts'
import { runConnection } from './runConnection.ts'

vi.mock('./client.ts', () => ({ createClient: vi.fn() }))

import { createClient } from './client.ts'

const clientOptions = () => ({ studioUrl: 'https://kubb.studio', configPath: 'kubb.config.ts', version: '1.0.0', loadConfig: vi.fn() })

type FakeClient = {
  connect: Mock<() => Promise<void>>
  disconnect: Mock<() => void>
  /**
   * What the pool would call for a token rejected during background reconnect, once it has stopped.
   */
  onAuthRequired?: (error: InvalidAgentTokenError) => void
  token?: string
}

/**
 * Queues one client per attempt. `connect` decides how that attempt ends, and every client records
 * whether it was disconnected, which is what the run promises before it moves on.
 */
function queueClients(...connects: Array<() => Promise<void>>): Array<FakeClient> {
  const clients: Array<FakeClient> = connects.map((connect) => ({ connect: vi.fn(connect), disconnect: vi.fn() }))
  let attempt = 0

  vi.mocked(createClient).mockImplementation((options) => {
    const client = clients[attempt++]
    if (!client) throw new Error('createClient was called more times than the test queued')

    client.onAuthRequired = options.onAuthRequired
    client.token = options.token

    return client
  })

  return clients
}

const rejected = () => Promise.reject(new InvalidAgentTokenError('https://kubb.studio'))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runConnection', () => {
  it('stops before opening a client when the run is already shutting down', async () => {
    const clients = queueClients()
    const controller = new AbortController()
    controller.abort()

    await expect(runConnection({ credentials: { token: 'a' }, clientOptions, onTokenRejected: vi.fn(), signal: controller.signal })).resolves.toBe('shutdown')
    expect(clients).toHaveLength(0)
    expect(createClient).not.toHaveBeenCalled()
  })

  it('ends the run when the signal aborts while the session is live', async () => {
    const clients = queueClients(() => Promise.resolve())
    const controller = new AbortController()

    const outcome = runConnection({ credentials: { token: 'a' }, clientOptions, onTokenRejected: vi.fn(), signal: controller.signal })
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    controller.abort()

    await expect(outcome).resolves.toBe('shutdown')
    expect(clients[0]?.disconnect).toHaveBeenCalled()
  })

  it('reports a token rejected before a session opened, then reconnects with the replacement', async () => {
    const clients = queueClients(rejected, () => Promise.resolve())
    const controller = new AbortController()
    const onTokenRejected = vi.fn(async () => ({ token: 'b' }))
    const options = vi.fn(clientOptions)

    const outcome = runConnection({ credentials: { token: 'a' }, clientOptions: options, onTokenRejected, signal: controller.signal })
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(2))
    controller.abort()

    await expect(outcome).resolves.toBe('shutdown')
    expect(onTokenRejected).toHaveBeenCalledWith({ error: expect.any(InvalidAgentTokenError), credentials: { token: 'a' }, live: false })
    expect(clients[0]?.disconnect).toHaveBeenCalled()
    expect(clients[1]?.token).toBe('b')
    // Options are rebuilt per attempt, so a host that re-derives them from the credential is heard.
    expect(options.mock.calls).toEqual([[{ token: 'a' }], [{ token: 'b' }]])
  })

  it('reports a token rejected during a live session as live', async () => {
    const clients = queueClients(
      () => Promise.resolve(),
      () => Promise.resolve(),
    )
    const controller = new AbortController()
    const onTokenRejected = vi.fn(async () => ({ token: 'b' }))

    const outcome = runConnection({ credentials: { token: 'a' }, clientOptions, onTokenRejected, signal: controller.signal })
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    clients[0]?.onAuthRequired?.(new InvalidAgentTokenError('https://kubb.studio'))

    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(2))
    controller.abort()

    await expect(outcome).resolves.toBe('shutdown')
    expect(onTokenRejected).toHaveBeenCalledWith({ error: expect.any(InvalidAgentTokenError), credentials: { token: 'a' }, live: true })
  })

  it('ends the run when the host declines to replace the token', async () => {
    queueClients(rejected)

    await expect(runConnection({ credentials: { token: 'a' }, clientOptions, onTokenRejected: async () => null })).resolves.toBe('stopped')
  })

  it('rethrows anything that is not a rejected token, since sessions retry those themselves', async () => {
    const error = new Error('ECONNREFUSED')
    const clients = queueClients(() => Promise.reject(error))
    const onTokenRejected = vi.fn()

    await expect(runConnection({ credentials: { token: 'a' }, clientOptions, onTokenRejected })).rejects.toBe(error)
    expect(onTokenRejected).not.toHaveBeenCalled()
    // The attempt still closes its client on the way out.
    expect(clients[0]?.disconnect).toHaveBeenCalled()
  })
})
