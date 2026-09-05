import { afterEach, describe, expect, it, vi } from 'vitest'
import { InvalidAgentTokenError } from './api.ts'
import { createClient } from './client.ts'
import type { ConnectToStudioOptions } from './connectStudio.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  registerAgent: vi.fn().mockResolvedValue(true),
}))

vi.mock('./connectStudio.ts', () => ({
  connectToStudio: vi.fn(),
}))

import { registerAgent } from './api.ts'
import { connectToStudio } from './connectStudio.ts'

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
  it('opens one connectToStudio session per pool slot, each with its own AbortSignal listener', async () => {
    vi.mocked(connectToStudio).mockResolvedValue(undefined)

    const client = createClient({ ...options, poolSize: 3 })
    await client.connect()

    expect(connectToStudio).toHaveBeenCalledTimes(3)
    expect(registerAgent).toHaveBeenCalledWith({ token: 'my-token', studioUrl: 'https://kubb.studio', poolSize: 3 })
  })

  it('fires onAuthRequired once when several pool sessions reject the same token concurrently', async () => {
    const onAuthRequired = vi.fn()
    const capturedOptions: Array<ConnectToStudioOptions> = []

    vi.mocked(connectToStudio).mockImplementation((opts) => {
      capturedOptions.push(opts)
      // Every pool slot resolves startup normally: the rejection happens later, during background
      // reconnect, which is exactly what onAuthRequired covers.
      return Promise.resolve()
    })

    const client = createClient({ ...options, poolSize: 3, onAuthRequired })
    await client.connect()

    const error = new InvalidAgentTokenError('https://kubb.studio')

    // Two pool sessions reject the same dead token at once.
    capturedOptions[0]?.onAuthRequired?.(error)
    capturedOptions[1]?.onAuthRequired?.(error)
    capturedOptions[2]?.onAuthRequired?.(error)

    expect(onAuthRequired).toHaveBeenCalledTimes(1)
    expect(onAuthRequired).toHaveBeenCalledWith(error)
  })

  it('aborts the pool signal before calling the caller onAuthRequired', async () => {
    const calls: Array<string> = []
    const onAuthRequired = vi.fn(() => calls.push('onAuthRequired'))
    let capturedSignal: AbortSignal | undefined

    vi.mocked(connectToStudio).mockImplementation((opts) => {
      capturedSignal = opts.signal
      capturedSignal?.addEventListener('abort', () => calls.push('abort'))

      return Promise.resolve()
    })

    const client = createClient({ ...options, poolSize: 1, onAuthRequired })
    await client.connect()

    vi.mocked(connectToStudio).mock.calls[0]?.[0].onAuthRequired?.(new InvalidAgentTokenError('https://kubb.studio'))

    expect(calls).toStrictEqual(['abort', 'onAuthRequired'])
    expect(capturedSignal?.aborted).toBe(true)
  })

  it('rejects connect() with the startup error instead of calling onAuthRequired', async () => {
    const onAuthRequired = vi.fn()
    const error = new InvalidAgentTokenError('https://kubb.studio')
    vi.mocked(connectToStudio).mockRejectedValue(error)

    const client = createClient({ ...options, onAuthRequired })

    await expect(client.connect()).rejects.toBe(error)
    expect(onAuthRequired).not.toHaveBeenCalled()
  })
})
