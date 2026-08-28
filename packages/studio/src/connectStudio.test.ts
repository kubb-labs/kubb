import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setLogLevel } from './logger.ts'
import { spyOnConsole } from './console.mock.ts'
import { MockWebSocket } from './websocket.mock.ts'
import type { AgentConnectResponse } from './protocol/index.ts'
import type { ConnectToStudioOptions } from './connectStudio.ts'
import { connectToStudio } from './connectStudio.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./generate.ts', () => ({
  generate: vi.fn().mockResolvedValue(undefined),
}))

// Config resolution runs for real. It reaches outside the process in two ways — `import()`-ing a
// plugin package and `import()`-ing the adapter package — so those packages are what gets stubbed.
vi.mock('@kubb/plugin-ts', () => ({ pluginTs: (options: unknown) => ({ name: 'plugin-ts', options }) }))
vi.mock('@kubb/plugin-zod', () => ({ pluginZod: (options: unknown) => ({ name: 'plugin-zod', options }) }))
vi.mock('@kubb/adapter-oas', () => ({ adapterOas: (options: unknown) => ({ name: 'oas', options, parse: vi.fn() }) }))

// `setupHookListener` spawns the formatter, the linter, and postGenerate commands through tinyexec.
vi.mock('tinyexec', () => ({ x: vi.fn(() => Object.assign(Promise.resolve({ exitCode: 0 }), { [Symbol.asyncIterator]: async function* () {} })) }))

vi.mock('./ws.ts', () => ({
  createWebsocket: vi.fn(),
  sendAgentMessage: vi.fn(),
  setupEventsStream: vi.fn(),
}))

vi.mock('@kubb/core/package.json', () => ({
  default: { version: '5.0.0-test' },
  version: '5.0.0-test',
}))

import type { Storage } from 'unstorage'
import { setStorage } from './machine.ts'
import { createAgentSession, disconnect } from './api.ts'
import { generate } from './generate.ts'

import { createWebsocket, sendAgentMessage, setupEventsStream } from './ws.ts'

// Shared test helpers

const consoleSpy = spyOnConsole()

const loadConfig = vi.fn()

// The saved Studio config goes through the real storage port rather than a mocked module, so these
// spies assert what actually reaches disk.
const getLatestStudioConfigFromStorage = vi.fn().mockResolvedValue(null)
const saveStudioConfigToStorage = vi.fn().mockResolvedValue(undefined)

const makeSession = (overrides: Partial<AgentConnectResponse> = {}): AgentConnectResponse => ({
  sessionId: 'session-abc',
  slug: 'brave-otter',
  wsUrl: 'ws://localhost:3000/ws/session-abc',
  isSandbox: false,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  revokedAt: null,
  ...overrides,
})

const makeConfig = (overrides = {}) => ({
  name: 'test',
  input: 'spec.yaml',
  output: { path: './gen', write: false },
  plugins: [],
  ...overrides,
})

describe('connectToStudio', () => {
  let mockWs: MockWebSocket
  let options: ConnectToStudioOptions
  let controller: AbortController

  beforeEach(() => {
    mockWs = new MockWebSocket()
    controller = new AbortController()
    // These drive `connectToStudio` directly, so nothing calls `createClient` to set the level.
    setLogLevel('verbose')

    getLatestStudioConfigFromStorage.mockResolvedValue(null)
    saveStudioConfigToStorage.mockResolvedValue(undefined)
    setStorage({
      getItem: () => getLatestStudioConfigFromStorage(),
      setItem: (_key: string, value: unknown) => saveStudioConfigToStorage(value),
    } as unknown as Storage)

    vi.mocked(createWebsocket).mockReturnValue(mockWs as any)
    vi.mocked(createAgentSession).mockResolvedValue(makeSession())
    loadConfig.mockResolvedValue(makeConfig() as any)

    options = {
      token: 'my-token',
      studioUrl: 'https://kubb.studio',
      configPath: 'kubb.config.ts',
      loadConfig,
      version: '1.0.0',
      signal: controller.signal,
      allowWrite: false,
      allowInput: false,
      root: '/project',
      retryInterval: 100,
    }
  })

  afterEach(() => {
    // `connectToStudio` retries forever until its signal aborts, so a test that leaves a failed
    // connection behind would keep reconnecting into the next one.
    controller.abort()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  afterAll(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore())
  })

  // Session creation

  it('creates an agent session with the provided credentials', async () => {
    await connectToStudio(options)

    expect(createAgentSession).toHaveBeenCalledWith({
      token: 'my-token',
      studioUrl: 'https://kubb.studio',
    })
  })

  it('creates a WebSocket with the session wsUrl and Bearer auth header', async () => {
    await connectToStudio(options)

    expect(createWebsocket).toHaveBeenCalledWith('ws://localhost:3000/ws/session-abc', {
      headers: { Authorization: 'Bearer my-token' },
    })
  })

  // Studio being unreachable at startup is temporary (a 502 mid-deploy), and no socket exists yet,
  // so none of the socket-driven reconnect paths can fire. Giving up here would drop the pool slot
  // for the lifetime of the process.
  it('retries instead of giving up when the session cannot be created', async () => {
    vi.useFakeTimers()
    vi.mocked(createAgentSession).mockRejectedValueOnce(new Error('Network error'))

    await connectToStudio(options)

    expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Network error'))

    await vi.advanceTimersByTimeAsync(options.retryInterval!)

    expect(createAgentSession).toHaveBeenCalledTimes(2)
  })

  // Studio counts an agent offline once its ping is older than its liveness window, so the clamp
  // is a protocol contract. It lives here because every host goes through this function.
  it('clamps a heartbeat interval above the ceiling Studio allows', async () => {
    vi.useFakeTimers()

    await connectToStudio({ ...options, heartbeatInterval: 10 * 60_000 })
    await mockWs.trigger('open')
    vi.mocked(sendAgentMessage).mockClear()

    await vi.advanceTimersByTimeAsync(30_000)

    expect(sendAgentMessage).toHaveBeenCalledWith(mockWs, { type: 'ping' })
  })

  it('stops retrying once the signal aborts', async () => {
    vi.useFakeTimers()
    vi.mocked(createAgentSession).mockRejectedValueOnce(new Error('Network error'))

    await connectToStudio(options)
    controller.abort()

    await vi.advanceTimersByTimeAsync(options.retryInterval! * 3)

    expect(createAgentSession).toHaveBeenCalledTimes(1)
  })

  // WebSocket messages

  it('logs info when a pong message is received', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'pong' }) })

    expect(consoleSpy.debug).toHaveBeenCalledWith(expect.stringContaining('Received "pong" from Studio'))
  })

  it('logs a warning for unknown message types', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'unknown' }),
    })

    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown message type'))
  })

  // Handshake and liveness

  it('sends the connected payload when the WebSocket opens', async () => {
    await connectToStudio(options)

    await mockWs.trigger('open')

    // onOpen sends the connected payload without awaiting it, and it now reads storage first,
    // so let the fire-and-forget send settle before asserting.
    await vi.waitFor(() => expect(sendAgentMessage).toHaveBeenCalledWith(mockWs, expect.objectContaining({ type: 'connected' })))
  })

  it('logs the slug when the WebSocket opens', async () => {
    await connectToStudio(options)

    await mockWs.trigger('open')

    expect(consoleSpy.log).toHaveBeenCalledWith('[brave-otter] Connected to Kubb Studio')
  })

  it('logs the slug when the WebSocket errors', async () => {
    await connectToStudio(options)

    await mockWs.trigger('error')

    expect(consoleSpy.error).toHaveBeenCalledWith('[brave-otter] Failed to connect to Kubb Studio')
  })

  it('terminates the connection when no pong arrives within two heartbeat intervals', async () => {
    vi.useFakeTimers()
    options.heartbeatInterval = 1_000

    await connectToStudio(options)
    await mockWs.trigger('open')

    await vi.advanceTimersByTimeAsync(3_000)

    expect(mockWs.terminated).toBe(true)
  })

  it('keeps the connection alive while pongs keep arriving', async () => {
    vi.useFakeTimers()
    options.heartbeatInterval = 1_000

    await connectToStudio(options)
    await mockWs.trigger('open')

    for (const _ of Array.from({ length: 5 })) {
      await vi.advanceTimersByTimeAsync(1_000)
      await mockWs.trigger('message', { data: JSON.stringify({ type: 'pong' }) })
    }

    expect(mockWs.terminated).toBe(false)
  })

  // generate command

  it('calls generate with the resolved config on a generate command', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ name: 'test' }),
      }),
    )
  })

  it('generates with the plugins the payload names', async () => {
    const payload = { plugins: [{ name: '@kubb/plugin-ts', options: {} }] }

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ config: expect.objectContaining({ plugins: [expect.objectContaining({ name: 'plugin-ts' })] }) }),
    )
  })

  it('disables write in sandbox mode even when allowWrite is true', async () => {
    vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))

    await connectToStudio({ ...options, allowWrite: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          output: expect.objectContaining({ write: false }),
        }),
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

    await sandboxWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          input: 'openapi: "3.0.0"',
        }),
      }),
    )
  })

  it('ignores inline input from payload for a local agent that has not opted in', async () => {
    const payload = { input: 'openapi: "3.0.0"', plugins: [] }

    await connectToStudio(options) // allowInput: false

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    // Without allowInput the spec stays the on-disk config.input
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ input: 'spec.yaml' }),
      }),
    )
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('KUBB_AGENT_ALLOW_INPUT'))
  })

  it('uses inline input from payload for a local agent when allowInput is enabled', async () => {
    const payload = { input: 'openapi: "3.0.0"', plugins: [] }

    await connectToStudio({ ...options, allowInput: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ input: 'openapi: "3.0.0"' }),
      }),
    )
  })

  it('falls back to the on-disk input for a local agent when allowInput is enabled but no spec is sent', async () => {
    const payload = { plugins: [] }

    await connectToStudio({ ...options, allowInput: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ input: 'spec.yaml' }),
      }),
    )
  })

  it('skips the formatter, the linter, and postGenerate when exec is not allowed', async () => {
    loadConfig.mockResolvedValue(makeConfig({ output: { path: './gen', format: 'auto', lint: 'auto', postGenerate: ['echo hi'] } }))

    await connectToStudio({ ...options, allowExec: false })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload: { plugins: [] } }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ output: expect.objectContaining({ format: false, lint: false, postGenerate: [] }) }),
      }),
    )
  })

  it('rejects a payload naming a plugin outside the allow-list instead of importing it', async () => {
    await connectToStudio({ ...options, allowedPlugins: ['@kubb/plugin-ts'] })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload: { plugins: [{ name: 'evil-module', options: {} }] } }),
    })

    expect(generate).not.toHaveBeenCalled()
    // `logger.exception` hands the Error to console.error rather than flattening it, so the cause
    // chain stays inspectable.
    expect(consoleSpy.error).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ message: expect.stringContaining('evil-module') }))
  })

  it('persists the payload to storage regardless of write permission', async () => {
    const payload = { plugins: [] }

    await connectToStudio(options) // allowWrite: false

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    expect(saveStudioConfigToStorage).toHaveBeenCalledWith(expect.objectContaining({ plugins: [] }))
  })

  it('persists the OpenAPI input when the agent opts in', async () => {
    const payload = { plugins: [], input: 'openapi: "3.0.0"' }

    await connectToStudio({ ...options, allowInput: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    expect(saveStudioConfigToStorage).toHaveBeenCalledWith(expect.objectContaining({ input: 'openapi: "3.0.0"' }))
  })

  it('drops the OpenAPI input from the persisted config when the agent has not opted in', async () => {
    const payload = { plugins: [], input: 'openapi: "3.0.0"' }

    await connectToStudio(options) // allowInput: false

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    const [saved] = saveStudioConfigToStorage.mock.calls[0] ?? []
    expect(saved?.input).toBeUndefined()
  })

  it('does not persist studioConfig when there is no payload', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    expect(saveStudioConfigToStorage).not.toHaveBeenCalled()
  })

  it('does not persist studioConfig in sandbox mode', async () => {
    vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))
    const sandboxWs = new MockWebSocket()
    vi.mocked(createWebsocket).mockReturnValue(sandboxWs as any)
    const payload = { plugins: [] }

    await connectToStudio(options)

    await sandboxWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    expect(saveStudioConfigToStorage).not.toHaveBeenCalled()
  })

  it('does not persist studioConfig for a multi-session pool', async () => {
    const payload = { plugins: [] }

    await connectToStudio({ ...options, poolSize: 2 })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    // The config-path key is shared across pool sessions, so persisting would leak one user's config to another
    expect(saveStudioConfigToStorage).not.toHaveBeenCalled()
  })

  it('does not read the stored studio config for a multi-session pool', async () => {
    getLatestStudioConfigFromStorage.mockResolvedValue({ plugins: [{ name: '@kubb/plugin-ts', options: {} }] })

    await connectToStudio({ ...options, poolSize: 2 })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    expect(getLatestStudioConfigFromStorage).not.toHaveBeenCalled()
  })

  it('falls back to stored studio config when generate command has no payload', async () => {
    const storedConfig = {
      plugins: [{ name: '@kubb/plugin-ts', options: { enumType: 'asConst' } }],
    }
    getLatestStudioConfigFromStorage.mockResolvedValueOnce(storedConfig)

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    expect(getLatestStudioConfigFromStorage).toHaveBeenCalled()
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ config: expect.objectContaining({ plugins: [expect.objectContaining({ name: 'plugin-ts' })] }) }),
    )
  })

  it('uses the payload plugins over the stored studio config when both are present', async () => {
    const storedConfig = {
      plugins: [{ name: '@kubb/plugin-ts', options: { enumType: 'asConst' } }],
    }
    getLatestStudioConfigFromStorage.mockResolvedValueOnce(storedConfig)

    const payload = { plugins: [{ name: '@kubb/plugin-zod', options: {} }] }

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    // The payload's plugin wins over the stored one
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ config: expect.objectContaining({ plugins: [expect.objectContaining({ name: 'plugin-zod' })] }) }),
    )
  })

  // An adapter instance carries closures that cannot survive JSON, so the payload is an options
  // patch: the adapter factory is re-invoked with the merged options rather than replaced by the
  // plain object Studio sent.
  it('re-invokes the adapter factory with the payload options merged in', async () => {
    loadConfig.mockResolvedValueOnce(makeConfig({ adapter: { name: 'oas', options: { validate: true } } }) as any)
    const payload = { adapter: { server: { index: 1 } }, plugins: [] }

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    const adapter = vi.mocked(generate).mock.calls[0]?.[0].config.adapter

    expect(adapter?.options).toStrictEqual({ validate: true, server: { index: 1 } })
    expect(adapter).toHaveProperty('parse')
  })

  it('preserves the disk config adapter when payload has no adapter', async () => {
    const diskAdapter = { name: 'oas', options: {}, parse: vi.fn() }
    loadConfig.mockResolvedValueOnce(makeConfig({ adapter: diskAdapter }) as any)
    const payload = { plugins: [] }

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload }),
    })

    const call = vi.mocked(generate).mock.calls[0]?.[0]
    expect(call?.config).toHaveProperty('adapter', diskAdapter)
  })

  it('ignores a second generate command while one is already in progress', async () => {
    let resolveGenerate: () => void = () => {}
    vi.mocked(generate).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGenerate = resolve
        }),
    )

    await connectToStudio(options)

    const first = mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    // Wait until `generate()` is actually in flight (loadConfig/mergePlugins/etc. resolve
    // over several microtasks) before firing the second command, so it reliably lands
    // while the first generation is still running.
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1))

    const second = mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    resolveGenerate()
    await Promise.all([first, second])

    expect(generate).toHaveBeenCalledTimes(1)
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('already in progress'))
  })

  it('allows a new generate command once the previous one has finished', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })
    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate' }),
    })

    expect(generate).toHaveBeenCalledTimes(2)
  })

  // The event stream is wired to the generation emitter only. The connection emitter carries just
  // `kubb:error`, so two generations can never interleave their events on one socket.
  it('uses an isolated hooks emitter for each generate command', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'generate', payload: { plugins: [] } }),
    })

    const generationHooks = vi.mocked(setupEventsStream).mock.calls[0]?.[1]
    const generateHooks = vi.mocked(generate).mock.calls[0]?.[0].hooks

    expect(setupEventsStream).toHaveBeenCalledTimes(1)
    expect(generateHooks).toBe(generationHooks)
  })

  // connect command

  it('sends a connected message with agent info on a connect command', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        type: 'connected',
        payload: expect.objectContaining({
          versions: {
            kubb: '5.0.0-test',
            agent: '1.0.0',
          },
          configPath: 'kubb.config.ts',
          root: '/project',
        }),
      }),
    )
  })

  it('reflects allowWrite in permissions on connect command', async () => {
    await connectToStudio({ ...options, allowWrite: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowWrite: true,
            allowInput: false,
            allowExec: false,
          },
        }),
      }),
    )
  })

  it('advertises allowInput in permissions when the agent opts in', async () => {
    await connectToStudio({ ...options, allowInput: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowWrite: false,
            allowInput: true,
            allowExec: false,
          },
        }),
      }),
    )
  })

  it('disables write in sandbox mode but still accepts input', async () => {
    vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))
    const sandboxWs = new MockWebSocket()
    vi.mocked(createWebsocket).mockReturnValue(sandboxWs as any)

    await connectToStudio({ ...options, allowWrite: true })

    await sandboxWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      sandboxWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowWrite: false,
            allowInput: true,
            allowExec: false,
          },
        }),
      }),
    )
  })

  it('replays the saved studio config as studioConfig in the connected payload', async () => {
    const stored = { plugins: [{ name: '@kubb/plugin-ts', options: { enum: { type: 'asConst' } } }], input: 'openapi: "3.0.0"' }
    getLatestStudioConfigFromStorage.mockResolvedValue(stored)

    await connectToStudio({ ...options, allowInput: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        type: 'connected',
        payload: expect.objectContaining({ studioConfig: stored }),
      }),
    )
  })

  it('omits the saved input from studioConfig when input is not allowed', async () => {
    const stored = { plugins: [], input: 'openapi: "3.0.0"' }
    getLatestStudioConfigFromStorage.mockResolvedValue(stored)

    await connectToStudio(options) // allowInput: false

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({ studioConfig: { plugins: [] } }),
      }),
    )
  })

  it('does not replay studioConfig in the connected payload for a multi-session pool', async () => {
    getLatestStudioConfigFromStorage.mockResolvedValue({ plugins: [{ name: '@kubb/plugin-ts', options: {} }] })

    await connectToStudio({ ...options, poolSize: 2, allowInput: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    const message = vi.mocked(sendAgentMessage).mock.calls.at(-1)?.[1]
    const connected = message?.type === 'connected' ? message : undefined
    expect(connected?.payload.studioConfig).toBeUndefined()
    expect(getLatestStudioConfigFromStorage).not.toHaveBeenCalled()
  })

  it('leaves studioConfig undefined when nothing has been saved', async () => {
    getLatestStudioConfigFromStorage.mockResolvedValue(null)

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'command', command: 'connect' }),
    })

    const message = vi.mocked(sendAgentMessage).mock.calls.at(-1)?.[1]
    const connected = message?.type === 'connected' ? message : undefined
    expect(connected?.payload.studioConfig).toBeUndefined()
  })

  // Reconnect on close / error

  it('calls disconnect when the WebSocket closes', async () => {
    vi.useFakeTimers()

    await connectToStudio(options)

    await mockWs.trigger('close')

    expect(disconnect).toHaveBeenCalledWith({
      sessionId: 'session-abc',
      studioUrl: 'https://kubb.studio',
      token: 'my-token',
      slug: 'brave-otter',
    })
  })

  it('closes the WebSocket without reconnecting when a disconnect message with reason "revoked" is received', async () => {
    vi.useFakeTimers()

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'disconnect', reason: 'revoked' }),
    })

    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('disconnected by Studio (revoked)'))
    expect(mockWs.closed).toBe(true)
    // disconnect API must NOT be called — server already knows about the closure
    expect(disconnect).not.toHaveBeenCalled()
    // revoked sessions must NOT trigger a reconnect
    expect(consoleSpy.info).not.toHaveBeenCalledWith(expect.stringContaining('Retrying connection'))
  })

  it('cleans up and reconnects when a disconnect message with reason "expired" is received', async () => {
    vi.useFakeTimers()

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'disconnect', reason: 'expired' }),
    })

    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('disconnected by Studio (expired)'))
    expect(mockWs.closed).toBe(true)
    expect(disconnect).not.toHaveBeenCalled()
    // expired sessions trigger a reconnect (unlike revoked)
    expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('Retrying connection'))
  })

  it('reconnects on WS error', async () => {
    vi.useFakeTimers()

    await connectToStudio(options)

    await mockWs.trigger('error')

    expect(consoleSpy.error).toHaveBeenCalled()
  })

  it('logs and retries instead of crashing when a reconnect attempt fails to reach Studio', async () => {
    vi.useFakeTimers()
    const unhandledRejections: Array<unknown> = []
    const onUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason)
    // `bun-types` narrows `process.on` to its own event union, which omits Node's process events.
    const processEvents = process as unknown as NodeJS.EventEmitter
    processEvents.on('unhandledRejection', onUnhandledRejection)

    try {
      await connectToStudio(options)

      await mockWs.trigger('close')

      // The reconnect attempt scheduled after close fails to reach Studio (e.g. a 502)
      vi.mocked(createAgentSession).mockRejectedValueOnce(new Error('502 Bad Gateway'))
      vi.mocked(createAgentSession).mockResolvedValueOnce(makeSession())

      await vi.advanceTimersByTimeAsync(options.retryInterval!)
      await vi.advanceTimersByTimeAsync(0)

      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('502 Bad Gateway'))
      // the failed attempt schedules another reconnect rather than giving up
      await vi.advanceTimersByTimeAsync(options.retryInterval!)
      expect(createAgentSession).toHaveBeenCalledTimes(3)
      expect(unhandledRejections).toStrictEqual([])
    } finally {
      processEvents.off('unhandledRejection', onUnhandledRejection)
    }
  })
})
