import type { Config } from '@kubb/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentApi, StudioApi } from './protocol/index.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../package.json', () => ({ version: '5.0.0-test' }))

import { createAgentSession } from './api.ts'
describe('StudioSession RPC', () => {
  let local: AgentApi | undefined
  const studio: StudioApi = { ping: vi.fn().mockResolvedValue(undefined) }

  beforeEach(() => {
    vi.clearAllMocks()
    local = undefined
    vi.mocked(createAgentSession).mockResolvedValue({
      sessionId: 'session-1',
      slug: 'brave-otter',
      url: 'ws://studio/session-1',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      revokedAt: null,
      isSandbox: false,
      version: '1.0.0',
    })
  })

  const options = (): StudioSessionOptions => ({
    connector: async ({ local: api }) => {
      local = api
      return { studio, closed: new Promise<void>(() => {}), close: vi.fn() }
    },
    token: 'token',
    configPath: 'kubb.config.ts',
    version: '2.0.0',
    root: '/project',
    loadConfig: vi.fn().mockResolvedValue({ plugins: [], output: { path: 'src/gen' } } as unknown as Config),
  })

  it('attaches the authenticated socket and exposes the agent API', async () => {
    const session = new StudioSession(options())
    const started = session.start()
    await vi.waitFor(() => expect(local).toBe(session))
    await expect(local?.connect()).resolves.toMatchObject({ root: '/project', versions: { agent: '2.0.0' } })
    await started
  })

  it('reports an RPC disconnect to lifecycle hooks', async () => {
    let close: (() => void) | undefined
    const disconnected = vi.fn()
    const session = new StudioSession({
      ...options(),
      installLogger: (hooks) => {
        hooks.hook('studio:disconnected', disconnected)
      },
      connector: async ({ local: api }) => {
        local = api
        const closed = new Promise<void>((resolve) => {
          close = resolve
        })
        return { studio, closed, close: vi.fn() }
      },
    })

    const started = session.start()
    await vi.waitFor(() => expect(local).toBeDefined())
    await local?.connect()
    await started
    close?.()
    await vi.waitFor(() => expect(disconnected).toHaveBeenCalledWith({ reason: 'connection closed' }))
  })

  it('emits studio:ready only after Studio calls connect()', async () => {
    const ready = vi.fn()
    const session = new StudioSession({
      ...options(),
      installLogger: (hooks) => {
        hooks.hook('studio:ready', ready)
      },
    })

    const started = session.start()
    await vi.waitFor(() => expect(local).toBe(session))
    expect(ready).not.toHaveBeenCalled()
    await local?.connect()
    await started
    expect(ready).toHaveBeenCalledOnce()
  })
})
