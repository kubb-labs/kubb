import { afterEach, describe, expect, it, vi } from 'vitest'
import { InvalidAgentTokenError } from './api.ts'
import { createClient } from './client.ts'
import type { StudioSessionOptions } from './StudioSession.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  registerAgent: vi.fn().mockResolvedValue(true),
}))

/**
 * Stands in for a session: `connect()` runs this spy with the options the client built it with, so
 * a test can resolve, reject, or read back the callbacks the client passed in.
 */
const { sessionConnect } = vi.hoisted(() => ({ sessionConnect: vi.fn() }))

vi.mock('./StudioSession.ts', () => ({
  StudioSession: class {
    #options: StudioSessionOptions

    constructor(options: StudioSessionOptions) {
      this.#options = options
    }

    connect(): Promise<void> {
      return sessionConnect(this.#options)
    }
  },
}))

import { registerAgent } from './api.ts'

const options = {
  token: 'my-token',
  studioUrl: 'https://kubb.studio',
  configPath: 'kubb.config.ts',
  loadConfig: vi.fn(),
  version: '1.0.0',
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('createClient', () => {
  it('opens one session per pool slot, each with its own AbortSignal listener', async () => {
    sessionConnect.mockResolvedValue(undefined)

    const client = createClient({ ...options, poolSize: 3 })
    await client.connect()

    expect(sessionConnect).toHaveBeenCalledTimes(3)
    expect(registerAgent).toHaveBeenCalledWith({ token: 'my-token', studioUrl: 'https://kubb.studio', poolSize: 3 })
  })

  it('fires onAuthRequired once when several pool sessions reject the same token concurrently', async () => {
    const onAuthRequired = vi.fn()
    const capturedOptions: Array<StudioSessionOptions> = []

    sessionConnect.mockImplementation((opts) => {
      capturedOptions.push(opts)
      // Every pool slot resolves startup normally: the rejection happens later, during background
      // reconnect, which is exactly what onAuthRequired covers.
      return Promise.resolve()
    })

    const client = createClient({ ...options, poolSize: 3, onAuthRequired })
    await client.connect()

    const error = new InvalidAgentTokenError('https://kubb.studio')

    // Two pool sessions reject the same dead token at once.
    capturedOptions[0]?.onTokenRejected?.(error)
    capturedOptions[1]?.onTokenRejected?.(error)
    capturedOptions[2]?.onTokenRejected?.(error)

    expect(onAuthRequired).toHaveBeenCalledTimes(1)
    expect(onAuthRequired).toHaveBeenCalledWith(error)
  })

  it('aborts the pool signal before calling the caller onAuthRequired', async () => {
    const calls: Array<string> = []
    const onAuthRequired = vi.fn(() => calls.push('onAuthRequired'))
    let capturedSignal: AbortSignal | undefined

    sessionConnect.mockImplementation((opts) => {
      capturedSignal = opts.signal
      capturedSignal?.addEventListener('abort', () => calls.push('abort'))

      return Promise.resolve()
    })

    const client = createClient({ ...options, poolSize: 1, onAuthRequired })
    await client.connect()

    sessionConnect.mock.calls[0]?.[0].onTokenRejected?.(new InvalidAgentTokenError('https://kubb.studio'))

    expect(calls).toStrictEqual(['abort', 'onAuthRequired'])
    expect(capturedSignal?.aborted).toBe(true)
  })

  it('rejects connect() with the startup error instead of calling onAuthRequired', async () => {
    const onAuthRequired = vi.fn()
    const error = new InvalidAgentTokenError('https://kubb.studio')
    sessionConnect.mockRejectedValue(error)

    const client = createClient({ ...options, onAuthRequired })

    await expect(client.connect()).rejects.toBe(error)
    expect(onAuthRequired).not.toHaveBeenCalled()
  })
})
