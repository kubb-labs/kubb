import type { Config } from '@kubb/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentApi, StudioApi } from './protocol/index.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'
import { MockWebSocket } from './websocket.mock.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./ws.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./ws.ts')>()),
  createWebsocket: vi.fn(),
}))

vi.mock('../package.json', () => ({ version: '5.0.0-test' }))

import { createAgentSession } from './api.ts'
import { createWebsocket } from './ws.ts'

describe('StudioSession RPC', () => {
  let socket: MockWebSocket
  let local: AgentApi | undefined
  const studio: StudioApi = { event: vi.fn().mockResolvedValue(undefined), ping: vi.fn().mockResolvedValue(undefined) }

  beforeEach(() => {
    vi.clearAllMocks()
    socket = new MockWebSocket()
    local = undefined
    vi.mocked(createWebsocket).mockReturnValue(socket as never)
    vi.mocked(createAgentSession).mockResolvedValue({
      sessionId: 'session-1',
      slug: 'brave-otter',
      wsUrl: 'ws://studio/session-1',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      revokedAt: null,
      isSandbox: false,
      version: '1.0.0',
    })
  })

  const options = (): StudioSessionOptions => ({
    attach: (_socket, api) => {
      local = api
      return { remote: studio, close: vi.fn() }
    },
    token: 'token',
    configPath: 'kubb.config.ts',
    version: '2.0.0',
    root: '/project',
    loadConfig: vi.fn().mockResolvedValue({ plugins: [], output: { path: 'src/gen' } } as unknown as Config),
  })

  it('attaches the authenticated socket and exposes the agent API', async () => {
    const session = new StudioSession(options())
    await session.start()
    await socket.trigger('open')

    expect(local).toBe(session)
    await expect(local?.connect()).resolves.toMatchObject({ root: '/project', versions: { agent: '2.0.0' } })
  })

  it('ignores cancellation for a job that is not active', async () => {
    await expect(new StudioSession(options()).cancel({ jobId: 'other-job' })).resolves.toBeUndefined()
  })
})
