import type { KubbEvents } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { Storage } from 'unstorage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConnectToStudioOptions } from './connectStudio.ts'
import { connectToStudio } from './connectStudio.ts'
import type { AgentSession } from './isSessionValid.ts'
import { MockWebSocket } from '../mocks/websocket.ts'

vi.mock('./api.ts', () => ({
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./generate.ts', () => ({
  generate: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./loadConfig.ts', () => ({
  loadConfig: vi.fn(),
}))

vi.mock('./setupHookListener.ts', () => ({
  setupHookListener: vi.fn(),
}))

vi.mock('./resolvePlugins.ts', () => ({
  resolvePlugins: vi.fn().mockReturnValue([]),
}))

vi.mock('./studioConfig.ts', () => ({
  readStudioConfig: vi.fn().mockReturnValue(null),
  writeStudioConfig: vi.fn(),
}))

vi.mock('./logger.ts', () => ({
  logger: { info: vi.fn(), success: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('./isSessionValid.ts', () => ({
  isSessionValid: vi.fn().mockReturnValue(false),
}))

vi.mock('./ws.ts', () => ({
  createWebsocket: vi.fn(),
  sendAgentMessage: vi.fn(),
  setupEventsStream: vi.fn(),
}))

vi.mock('~~/package.json', () => ({ default: { version: '1.0.0' }, version: '1.0.0' }))

import { createAgentSession, disconnect } from './api.ts'
import { generate } from './generate.ts'
import { isSessionValid } from './isSessionValid.ts'
import { loadConfig } from './loadConfig.ts'
import { logger } from './logger.ts'
import { resolvePlugins } from './resolvePlugins.ts'
import { writeStudioConfig } from './studioConfig.ts'
import { createWebsocket, sendAgentMessage } from './ws.ts'

// Shared test helpers

const makeSession = (overrides: Partial<AgentSession> = {}): AgentSession => ({
  sessionToken: 'session-abc',
  wsUrl: 'ws://localhost:3000/ws/session-abc',
  isSandbox: false,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  revokedAt: null as any,
  storedAt: new Date().toISOString(),
  ...overrides,
})

const makeConfig = (overrides = {}) => ({
  name: 'test',
  input: { path: 'spec.yaml' },
  output: { path: './gen', write: false },
  plugins: [],
  ...overrides,
})


describe('connectToStudio', () => {
  let events: AsyncEventEmitter<KubbEvents>
  let mockWs: MockWebSocket
  let storage: Storage<AgentSession>
  let options: ConnectToStudioOptions

  beforeEach(() => {
    events = new AsyncEventEmitter<KubbEvents>()
    mockWs = new MockWebSocket()

    vi.mocked(createWebsocket).mockReturnValue(mockWs as any)
    vi.mocked(createAgentSession).mockResolvedValue(makeSession())
    vi.mocked(loadConfig).mockResolvedValue(makeConfig() as any)

    storage = {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
    } as any

    options = {
      token: 'my-token',
      studioUrl: 'https://studio.kubb.dev',
      configPath: 'kubb.config.ts',
      resolvedConfigPath: '/project/kubb.config.ts',
      noCache: false,
      allowWrite: false,
      root: '/project',
      retryInterval: 100,
      events,
      storage,
      sessionKey: 'kubb:session-key',
      nitro: { hooks: { hook: vi.fn() } } as any,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  // Session creation

  it('creates an agent session with the provided credentials', async () => {
    await connectToStudio(options)

    expect(createAgentSession).toHaveBeenCalledWith({ noCache: false, token: 'my-token', studioUrl: 'https://studio.kubb.dev' })
  })

  it('creates a WebSocket with the session wsUrl and Bearer auth header', async () => {
    await connectToStudio(options)

    expect(createWebsocket).toHaveBeenCalledWith('ws://localhost:3000/ws/session-abc', {
      headers: { Authorization: 'Bearer my-token' },
    })
  })

  it('removes the cached session and logs an error when createAgentSession throws', async () => {
    vi.mocked(createAgentSession).mockRejectedValueOnce(new Error('Network error'))
    vi.useFakeTimers()

    await connectToStudio(options)

    expect(storage.removeItem).toHaveBeenCalledWith('kubb:session-key')
    expect(logger.error).toHaveBeenCalled()
  })

  // WebSocket messages

  it('logs info when a pong message is received', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'pong' }) })

    expect(logger.info).toHaveBeenCalledWith('Received pong from Studio')
  })

  it('logs a warning for unknown message types', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'unknown' }) })

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown message type'))
  })

  // generate command

  it('calls generate with the resolved config on a generate command', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate' }) })

    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ config: expect.objectContaining({ name: 'test' }) }))
  })

  it('calls resolvePlugins with payload plugins when the generate command includes a payload', async () => {
    const payload = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }

    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate', payload }) })

    expect(resolvePlugins).toHaveBeenCalledWith(payload.plugins)
  })

  it('disables write in sandbox mode even when allowWrite is true', async () => {
    vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))

    await connectToStudio({ ...options, allowWrite: true })

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate' }) })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ output: expect.objectContaining({ write: false }) }),
      }),
    )
  })

  it('uses inline input from payload in sandbox mode', async () => {
    // Use a fresh connectToStudio call with isSandbox=true baked into the session
    vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))
    const sandboxWs = new MockWebSocket()
    vi.mocked(createWebsocket).mockReturnValue(sandboxWs as any)

    const payload = { input: 'openapi: "3.0.0"', plugins: [] }

    await connectToStudio(options)

    await sandboxWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate', payload }) })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ input: { data: 'openapi: "3.0.0"' } }),
      }),
    )
  })

  it('ignores inline input from payload when not in sandbox mode', async () => {
    const payload = { input: 'openapi: "3.0.0"', plugins: [] }

    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate', payload }) })

    // Input override is only applied in sandbox; config.input should remain unchanged
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ input: { path: 'spec.yaml' } }),
      }),
    )
  })

  it('persists the payload to studioConfig when allowWrite is true and payload is provided', async () => {
    const payload = { plugins: [] }

    await connectToStudio({ ...options, allowWrite: true })

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate', payload }) })

    expect(writeStudioConfig).toHaveBeenCalledWith('/project/kubb.config.ts', payload)
  })

  it('does not persist studioConfig when there is no payload', async () => {
    await connectToStudio({ ...options, allowWrite: true })

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate' }) })

    expect(writeStudioConfig).not.toHaveBeenCalled()
  })

  it('does not persist studioConfig when allowWrite is false', async () => {
    const payload = { plugins: [] }

    await connectToStudio(options) // allowWrite: false

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'generate', payload }) })

    expect(writeStudioConfig).not.toHaveBeenCalled()
  })

  // connect command

  it('sends a connected message with agent info on a connect command', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'connect' }) })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        type: 'connected',
        payload: expect.objectContaining({ version: '1.0.0', configPath: 'kubb.config.ts' }),
      }),
    )
  })

  it('reflects effectiveWrite in permissions on connect command', async () => {
    await connectToStudio({ ...options, allowWrite: true })

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'connect' }) })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: { allowAll: true, allowWrite: true },
        }),
      }),
    )
  })

  it('reports zero permissions in sandbox mode regardless of allowWrite', async () => {
    vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))
    const sandboxWs = new MockWebSocket()
    vi.mocked(createWebsocket).mockReturnValue(sandboxWs as any)

    await connectToStudio({ ...options, allowWrite: true })

    await sandboxWs.trigger('message', { data: JSON.stringify({ type: 'command', command: 'connect' }) })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      sandboxWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: { allowAll: false, allowWrite: false },
        }),
      }),
    )
  })

  // Reconnect on close / error

  it('calls disconnect and removes the session when the WebSocket closes', async () => {
    vi.useFakeTimers()

    await connectToStudio(options)

    await mockWs.trigger('close')

    expect(disconnect).toHaveBeenCalledWith({ sessionToken: 'session-abc', studioUrl: 'https://studio.kubb.dev', token: 'my-token' })
    expect(storage.removeItem).toHaveBeenCalledWith('kubb:session-key')
  })

  it('invalidates the cached session on WS error when the stored session is still valid', async () => {
    vi.useFakeTimers()
    vi.mocked(isSessionValid).mockReturnValue(true)
    ;(storage.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(makeSession())

    await connectToStudio(options)

    await mockWs.trigger('error')

    expect(storage.removeItem).toHaveBeenCalledWith('kubb:session-key')
  })

  it('logs the error but skips cache invalidation when noCache is true', async () => {
    vi.useFakeTimers()

    await connectToStudio({ ...options, noCache: true })

    await mockWs.trigger('error')

    expect(logger.error).toHaveBeenCalled()
    expect(storage.removeItem).not.toHaveBeenCalled()
  })
})
