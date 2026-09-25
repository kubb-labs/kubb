import { afterEach, describe, expect, it, vi } from 'vitest'
import { InvalidAgentTokenError } from './api.ts'
import { createClient } from './client.ts'
import type { StudioSessionOptions } from './StudioSession.ts'

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

    start(): Promise<void> {
      return sessionConnect(this.#options)
    }
  },
}))

const options = {
  attach: vi.fn(),
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
  it('opens one session for the whole process', async () => {
    sessionConnect.mockResolvedValue(undefined)

    await createClient(options).connect()

    expect(sessionConnect).toHaveBeenCalledOnce()
  })

  it('names the process with one instance id, and a new one for each client', async () => {
    sessionConnect.mockResolvedValue(undefined)

    await createClient(options).connect()
    await createClient(options).connect()

    const [first, second] = sessionConnect.mock.calls.map(([opts]) => (opts as StudioSessionOptions).instanceId)
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    expect(second).not.toBe(first)
  })

  it('fires onAuthRequired once, however often the session reports the rejected token', async () => {
    const onAuthRequired = vi.fn()
    let captured: StudioSessionOptions | undefined
    sessionConnect.mockImplementation((opts: StudioSessionOptions) => {
      captured = opts
      // Startup resolves normally: the rejection happens later, during background reconnect,
      // which is exactly what onAuthRequired covers.
      return Promise.resolve()
    })

    await createClient({ ...options, onAuthRequired }).connect()

    const error = new InvalidAgentTokenError('https://kubb.studio')
    captured?.onTokenRejected?.(error)
    captured?.onTokenRejected?.(error)

    expect(onAuthRequired).toHaveBeenCalledOnce()
    expect(onAuthRequired).toHaveBeenCalledWith(error)
    expect(captured?.signal?.aborted).toBe(true)
  })
})
