import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from '@kubb/core'
import { AgentCloseCode, type RpcClose } from '../protocol/index.ts'
import { IncompatibleAgentError, InvalidAgentTokenError, registerAgent } from '../operations/api.ts'
import { runConnection } from './runConnection.ts'

vi.mock('../operations/api.ts', async (original) => ({ ...(await original<typeof import('../operations/api.ts')>()), registerAgent: vi.fn() }))

beforeEach(() => {
  vi.mocked(registerAgent).mockReset().mockResolvedValue({ socketUrl: 'ws://studio/socket', version: '1.0.0', isSandbox: false })
})
afterEach(() => vi.restoreAllMocks())

function connection() {
  const shutdown = new AbortController()
  const closes: Array<(close?: RpcClose) => void> = []
  const ready = vi.fn()
  const retry = vi.fn()
  const options = () => ({
    configPath: 'kubb.config.ts',
    version: '1.0.0',
    retryInterval: 1,
    loadConfig: async () => ({ plugins: [] }) as unknown as Config,
    installLogger: (hooks: import('@kubb/core').Hookable<import('@kubb/core').KubbHooks>) => {
      hooks.hook('studio:ready', ready)
      hooks.hook('studio:reconnecting', retry)
    },
    connector: async ({ local }: Parameters<import('../protocol/index.ts').RpcConnector>[0]) => {
      const closed = Promise.withResolvers<RpcClose | void>()
      closes.push(closed.resolve)
      queueMicrotask(() => {
        void local.connect()
      })
      return { studio: { ping: async () => {} }, closed: closed.promise, close: () => closed.resolve() }
    },
  })
  return { shutdown, closes, ready, retry, options }
}

describe('runConnection', () => {
  it('does not retry a terminal close before the handshake completes', async () => {
    const c = connection()
    await expect(
      runConnection({
        credentials: { token: 'a' },
        clientOptions: () => ({
          ...c.options(),
          connector: async () => ({
            studio: { ping: async () => {} },
            closed: Promise.resolve({ code: AgentCloseCode.INCOMPATIBLE, reason: '' }),
            close: () => {},
          }),
        }),
        onTokenRejected: async () => null,
      }),
    ).resolves.toBe('stopped')
    expect(registerAgent).toHaveBeenCalledOnce()
    expect(c.retry).not.toHaveBeenCalled()
  })

  it('retries network failures and dropped sockets with the same instance, then stops cleanly', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    vi.mocked(registerAgent).mockRejectedValueOnce(new Error('offline'))
    const c = connection()
    const running = runConnection({ credentials: { token: 'a' }, clientOptions: c.options, signal: c.shutdown.signal, onTokenRejected: async () => null })
    await vi.waitFor(() => expect(c.ready).toHaveBeenCalledOnce())
    c.closes[0]?.()
    await vi.waitFor(() => expect(c.ready).toHaveBeenCalledTimes(2))
    c.shutdown.abort()
    await expect(running).resolves.toBe('shutdown')
    expect(c.retry).toHaveBeenCalledTimes(2)
    expect(new Set(vi.mocked(registerAgent).mock.calls.map(([options]) => options.instanceId)).size).toBe(1)
  })

  it('replaces a rejected credential, including after a live connection', async () => {
    const c = connection()
    const rejected = new InvalidAgentTokenError('https://studio.test')
    const replace = vi.fn(async () => ({ token: 'b' }))
    const options = vi.fn(c.options)
    const running = runConnection({ credentials: { token: 'a' }, clientOptions: options, signal: c.shutdown.signal, onTokenRejected: replace })
    await vi.waitFor(() => expect(c.ready).toHaveBeenCalledOnce())
    vi.mocked(registerAgent).mockRejectedValueOnce(rejected)
    c.closes[0]?.()
    await vi.waitFor(() => expect(c.ready).toHaveBeenCalledTimes(2))
    c.shutdown.abort()
    await running
    expect(replace).toHaveBeenCalledWith({ error: rejected, credentials: { token: 'a' }, live: true })
    expect(options.mock.calls).toEqual([[{ token: 'a' }], [{ token: 'b' }]])
  })

  it('stops when the host declines a startup rejection', async () => {
    vi.mocked(registerAgent).mockRejectedValue(new InvalidAgentTokenError('https://studio.test'))
    const c = connection()
    const replace = vi.fn(async () => null)
    await expect(runConnection({ credentials: { token: 'a' }, clientOptions: c.options, onTokenRejected: replace })).resolves.toBe('stopped')
    expect(replace).toHaveBeenCalledWith(expect.objectContaining({ live: false }))
  })

  it('throws IncompatibleAgentError without retrying when Studio needs a newer agent', async () => {
    vi.mocked(registerAgent).mockRejectedValue(new IncompatibleAgentError('https://studio.test', 'agent 5.3.0 is below 5.4.0'))
    const c = connection()
    await expect(runConnection({ credentials: { token: 'a' }, clientOptions: c.options, onTokenRejected: async () => null })).rejects.toBeInstanceOf(
      IncompatibleAgentError,
    )
    expect(registerAgent).toHaveBeenCalledOnce()
    expect(c.retry).not.toHaveBeenCalled()
  })

  it('stops on supersession and cancels a pending retry', async () => {
    const c = connection()
    const running = runConnection({ credentials: { token: 'a' }, clientOptions: c.options, signal: c.shutdown.signal, onTokenRejected: async () => null })
    await vi.waitFor(() => expect(c.ready).toHaveBeenCalledOnce())
    c.closes[0]?.({ code: AgentCloseCode.SUPERSEDED, reason: '' })
    await expect(running).resolves.toBe('stopped')
    expect(c.retry).not.toHaveBeenCalled()

    vi.spyOn(Math, 'random').mockReturnValue(1)
    vi.mocked(registerAgent).mockRejectedValue(new Error('offline'))
    const retrying = runConnection({
      credentials: { token: 'a' },
      clientOptions: () => ({ ...c.options(), retryInterval: 10_000 }),
      signal: c.shutdown.signal,
      onTokenRejected: async () => null,
    })
    await vi.waitFor(() => expect(c.retry).toHaveBeenCalledOnce())
    c.shutdown.abort()
    await expect(retrying).resolves.toBe('shutdown')
  })
})
