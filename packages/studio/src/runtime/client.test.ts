import { afterEach, describe, expect, it, vi } from 'vitest'
import { InvalidAgentTokenError } from '../operations/api.ts'
import { createClient } from './client.ts'
import { runConnection } from './runConnection.ts'

vi.mock('./runConnection.ts', () => ({ runConnection: vi.fn() }))
afterEach(() => vi.resetAllMocks())
const options = { token: 'token', configPath: 'kubb.config.ts', version: '1.0.0', loadConfig: vi.fn() }

describe('createClient facade', () => {
  it('starts one shared loop and forwards shutdown', async () => {
    vi.mocked(runConnection).mockImplementation(async ({ signal, onStarted }) => {
      onStarted?.()
      return new Promise((resolve) => signal?.addEventListener('abort', () => resolve('shutdown'), { once: true }))
    })
    const client = createClient(options)
    await client.connect()
    await client.connect()
    expect(runConnection).toHaveBeenCalledOnce()
    client.disconnect()
    expect(vi.mocked(runConnection).mock.calls[0]?.[0].signal?.aborted).toBe(true)
  })

  it('rejects startup authentication but notifies rejection after connect resolves', async () => {
    const error = new InvalidAgentTokenError('https://studio.test')
    const required = vi.fn()
    vi.mocked(runConnection).mockImplementation(async ({ onTokenRejected }) => {
      await onTokenRejected({ error, credentials: { token: 'token' }, live: false })
      return 'stopped'
    })
    await expect(createClient({ ...options, onAuthRequired: required }).connect()).rejects.toBe(error)
    expect(required).not.toHaveBeenCalled()
    vi.mocked(runConnection).mockImplementation(async ({ onStarted, onTokenRejected }) => {
      onStarted?.()
      await onTokenRejected({ error, credentials: { token: 'token' }, live: false })
      return 'stopped'
    })
    await createClient({ ...options, onAuthRequired: required }).connect()
    expect(required).toHaveBeenCalledOnce()
  })
})
