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
      rpcUrl: 'ws://studio/session-1',
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
    await session.start()
    expect(local).toBe(session)
    await expect(local?.connect()).resolves.toMatchObject({ root: '/project', versions: { agent: '2.0.0' } })
  })
})
