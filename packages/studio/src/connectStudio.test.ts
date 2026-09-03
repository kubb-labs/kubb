import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spyOnConsole } from './console.mock.ts'
import { MockWebSocket } from './websocket.mock.ts'
import type { AgentConnectResponse } from './protocol/index.ts'
import type { Hookable } from '@kubb/core'
import type { AgentHooks, StudioHooks } from './hooks.ts'
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
vi.mock('../package.json', () => ({
  default: { version: '5.0.0-test' },
  version: '5.0.0-test',
}))
vi.mock('@kubb/core/package.json', () => ({
  default: { version: '5.1.0-core-test' },
  version: '5.1.0-core-test',
}))

// `setupHookListener` spawns the formatter, the linter, and postGenerate commands through tinyexec.
vi.mock('tinyexec', () => ({ x: vi.fn(() => Object.assign(Promise.resolve({ exitCode: 0 }), { [Symbol.asyncIterator]: async function* () {} })) }))

vi.mock('./ws.ts', () => ({
  createWebsocket: vi.fn(),
  sendAgentMessage: vi.fn(),
  setupEventsStream: vi.fn(),
}))

import { createAgentSession, disconnect } from './api.ts'
import { generate } from './generate.ts'

import { createWebsocket, sendAgentMessage, setupEventsStream } from './ws.ts'

// Shared test helpers

const consoleSpy = spyOnConsole()

/**
 * Records the `studio:*` session events through the same `installLogger` hook a host uses, so a
 * test asserts the event and its context rather than a formatted console string.
 */
function recordSessionEvents() {
  const events: Array<{ name: keyof StudioHooks; ctx: Record<string, unknown> }> = []

  return {
    events,
    installLogger(hooks: Hookable<AgentHooks>) {
      for (const name of ['studio:connected', 'studio:disconnected', 'studio:command:start', 'studio:command:end', 'studio:warn', 'studio:error'] as const) {
        hooks.hook(name, (ctx) => {
          events.push({ name, ctx: ctx as unknown as Record<string, unknown> })
        })
      }
    },
    /**
     * The `message` of every recorded `studio:warn`, for a `stringContaining` style assertion.
     */
    warnings(): Array<string> {
      return events.filter((event) => event.name === 'studio:warn').map((event) => String(event.ctx.message))
    },
    errors(): Array<Error> {
      return events.filter((event) => event.name === 'studio:error').map((event) => event.ctx.error as Error)
    },
    named(name: keyof StudioHooks) {
      return events.filter((event) => event.name === name)
    },
  }
}

const loadConfig = vi.fn()

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
  let session: ReturnType<typeof recordSessionEvents>

  beforeEach(() => {
    mockWs = new MockWebSocket()
    session = recordSessionEvents()
    controller = new AbortController()
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
      installLogger: session.installLogger,
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

  it('installs the host renderer on the session emitter and on every generation', async () => {
    const emitters: Array<Hookable<AgentHooks>> = []

    await connectToStudio({ ...options, installLogger: (hooks) => void emitters.push(hooks) })

    // The session emitter, installed before the socket exists so a failed connect still reports.
    expect(emitters).toHaveLength(1)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate', payload: { plugins: [] } }),
    })

    // The generation gets its own emitter, so its events cannot bleed into another session's.
    expect(emitters).toHaveLength(2)
    expect(emitters[0]).not.toBe(emitters[1])
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

    expect(session.errors().map((error) => error.message)).toContainEqual(expect.stringContaining('Network error'))

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

    expect(sendAgentMessage).toHaveBeenCalledWith(mockWs, { type: 'agent:ping' })
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

  it('accepts a pong without treating it as an unknown message', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', { data: JSON.stringify({ type: 'studio:ping' }) })

    expect(session.warnings()).not.toContainEqual(expect.stringContaining('unknown message'))
  })

  it('logs a warning for unknown message types', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'unknown' }),
    })

    expect(session.warnings()).toContainEqual(expect.stringContaining('unknown message'))
  })

  // Handshake and liveness

  it('sends the connected payload when the WebSocket opens', async () => {
    await connectToStudio(options)

    await mockWs.trigger('open')

    // onOpen sends the connected payload without awaiting it, and it now reads storage first,
    // so let the fire-and-forget send settle before asserting.
    await vi.waitFor(() => expect(sendAgentMessage).toHaveBeenCalledWith(mockWs, expect.objectContaining({ type: 'agent:connect' })))
  })

  it('logs the slug when the WebSocket opens', async () => {
    await connectToStudio(options)

    await mockWs.trigger('open')

    expect(session.named('studio:connected')).toStrictEqual([{ name: 'studio:connected', ctx: { tag: 'brave-otter', studioUrl: 'https://kubb.studio' } }])
  })

  it('logs the slug when the WebSocket errors', async () => {
    await connectToStudio(options)

    await mockWs.trigger('error')

    expect(session.named('studio:error')).toStrictEqual([
      { name: 'studio:error', ctx: { tag: 'brave-otter', error: expect.objectContaining({ message: 'Failed to connect to Kubb Studio' }) } },
    ])
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
      await mockWs.trigger('message', { data: JSON.stringify({ type: 'studio:ping' }) })
    }

    expect(mockWs.terminated).toBe(false)
  })

  // save command

  describe('save', () => {
    const original = [
      `import { defineConfig } from 'kubb/config'`,
      `import { pluginTs } from '@kubb/plugin-ts'`,
      ``,
      `// Keep the enum shape stable for consumers.`,
      `export default defineConfig({`,
      `  input: './openapi.yaml',`,
      `  plugins: [pluginTs({ enum: { type: 'asConst' }, group: { type: 'tag', name: ({ group }) => group } })],`,
      `})`,
      ``,
    ].join('\n')

    let projectRoot: string
    let configFile: string

    /**
     * The `kubb:config-saved` reply the agent sent, if any.
     */
    const reply = () =>
      vi
        .mocked(sendAgentMessage)
        .mock.calls.map(([, message]) => message)
        .find((message) => message.type === 'agent:save')

    beforeEach(() => {
      projectRoot = mkdtempSync(path.join(tmpdir(), 'kubb-studio-'))
      configFile = path.join(projectRoot, 'kubb.config.ts')
      writeFileSync(configFile, original, 'utf-8')
      options = { ...options, root: projectRoot }
    })

    afterEach(() => {
      rmSync(projectRoot, { recursive: true, force: true })
    })

    const write = async (edits: Array<unknown>) => mockWs.trigger('message', { data: JSON.stringify({ type: 'studio:save', edits }) })

    it('writes a literal option and leaves the rest of the file alone', async () => {
      await connectToStudio({ ...options, allowConfigEdit: true })

      await write([{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }])

      expect(readFileSync(configFile, 'utf-8')).toBe(original.replace("'asConst'", "'enum'"))
      expect(reply()).toMatchObject({ payload: { changed: true, outcomes: [{ applied: true }] } })
    })

    it('comments a plugin out on disable and restores it on enable, keeping every other line', async () => {
      // A plugin needs its own line to be commented out safely, unlike `original` above where a
      // single call shares its line with `plugins: [`.
      const multiline = [
        `import { defineConfig } from 'kubb/config'`,
        `import { pluginTs } from '@kubb/plugin-ts'`,
        `import { pluginZod } from '@kubb/plugin-zod'`,
        ``,
        `export default defineConfig({`,
        `  plugins: [`,
        `    pluginTs({ enum: { type: 'asConst' } }),`,
        `    pluginZod({`,
        `      inferred: true,`,
        `    }),`,
        `  ],`,
        `})`,
        ``,
      ].join('\n')
      writeFileSync(configFile, multiline, 'utf-8')

      await connectToStudio({ ...options, allowConfigEdit: true })

      await write([{ operation: 'disable-plugin', plugin: '@kubb/plugin-zod' }])
      const disabled = readFileSync(configFile, 'utf-8')
      expect(disabled).toContain('// kubb:disabled @kubb/plugin-zod')
      expect(disabled).toContain('//   inferred: true,')
      expect(disabled).toContain("pluginTs({ enum: { type: 'asConst' } }),")

      await write([{ operation: 'enable-plugin', plugin: '@kubb/plugin-zod' }])
      expect(readFileSync(configFile, 'utf-8')).toBe(multiline)
    })

    it('refuses every edit when editing the config was not granted', async () => {
      await connectToStudio({ ...options, allowConfigEdit: false })

      await write([{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }])

      expect(readFileSync(configFile, 'utf-8')).toBe(original)
      expect(reply()?.payload).toMatchObject({ changed: false, outcomes: [{ applied: false }] })
    })

    it('refuses in sandbox mode even when the host granted it', async () => {
      vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))

      await connectToStudio({ ...options, allowConfigEdit: true })

      await write([{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }])

      expect(readFileSync(configFile, 'utf-8')).toBe(original)
    })

    it('leaves an option customized in code untouched', async () => {
      await connectToStudio({ ...options, allowConfigEdit: true })

      await write([{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['group', 'name'], value: 'x' }])

      expect(readFileSync(configFile, 'utf-8')).toBe(original)
      expect(reply()?.payload.outcomes[0]?.reason).toBe('group.name is customized in code')
    })

    // Studio only ever saw the file as it was on connect. Re-reading it right before the patch is
    // what saves an edit the user made in their editor since then.
    it('patches the file as it is on disk, not as it was on connect', async () => {
      await connectToStudio({ ...options, allowConfigEdit: true })

      const editedByHand = original.replace("'./openapi.yaml'", "'./petstore.yaml'")
      writeFileSync(configFile, editedByHand, 'utf-8')

      await write([{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }])

      expect(readFileSync(configFile, 'utf-8')).toBe(editedByHand.replace("'asConst'", "'enum'"))
    })

    // Studio waits on the reply, so a failure that produced none would hang its UI.
    it('still replies when the config file cannot be read', async () => {
      await connectToStudio({ ...options, allowConfigEdit: true })

      rmSync(configFile)
      await write([{ operation: 'set', plugin: '@kubb/plugin-ts', path: ['enum', 'type'], value: 'enum' }])

      expect(reply()?.payload).toMatchObject({ changed: false, outcomes: [{ applied: false }] })
    })

    it('still replies when the message carries no edits', async () => {
      await connectToStudio({ ...options, allowConfigEdit: true })

      await mockWs.trigger('message', { data: JSON.stringify({ type: 'studio:save' }) })

      expect(reply()?.payload).toMatchObject({ changed: false, outcomes: [] })
    })

    it('reports what the file holds on connect so Studio can disable the right controls', async () => {
      await connectToStudio({ ...options, allowConfigEdit: true })

      await mockWs.trigger('message', { data: JSON.stringify({ type: 'studio:connect' }) })

      const connected = vi
        .mocked(sendAgentMessage)
        .mock.calls.map(([, message]) => message)
        .find((message) => message.type === 'agent:connect')

      expect(connected?.type === 'agent:connect' && connected.payload.config.file).toStrictEqual({
        configs: [
          {
            name: undefined,
            plugins: [
              {
                importName: 'pluginTs',
                options: {
                  enum: {
                    literal: true,
                    value: {
                      type: 'asConst',
                    },
                  },
                  group: {
                    literal: false,
                  },
                },
                packageName: '@kubb/plugin-ts',
              },
            ],
          },
        ],
        managed: true,
      })
    })
  })

  // generate command

  it('calls generate with the resolved config on a generate command', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate' }),
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
      data: JSON.stringify({ type: 'studio:generate', payload }),
    })

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ config: expect.objectContaining({ plugins: [expect.objectContaining({ name: 'plugin-ts' })] }) }),
    )
  })

  it('disables write in sandbox mode even when allowWrite is true', async () => {
    vi.mocked(createAgentSession).mockResolvedValue(makeSession({ isSandbox: true }))

    await connectToStudio({ ...options, allowWrite: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate' }),
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
      data: JSON.stringify({ type: 'studio:generate', payload }),
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
      data: JSON.stringify({ type: 'studio:generate', payload }),
    })

    // Without allowInput the spec stays the on-disk config.input
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ input: 'spec.yaml' }),
      }),
    )
    expect(session.warnings()).toContainEqual(expect.stringContaining('KUBB_AGENT_ALLOW_INPUT'))
  })

  it('tells a CLI host to use --allowInput instead of the Docker-only env var', async () => {
    const payload = { input: 'openapi: "3.0.0"', plugins: [] }

    await connectToStudio({ ...options, client: { kind: 'cli', version: '1.0.0', cwd: '/project', projectName: 'project' } }) // allowInput: false

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate', payload }),
    })

    expect(session.warnings()).toContainEqual(expect.stringContaining('--allowInput'))
    expect(session.warnings()).not.toContainEqual(expect.stringContaining('KUBB_AGENT_ALLOW_INPUT'))
  })

  it('uses inline input from payload for a local agent when allowInput is enabled', async () => {
    const payload = { input: 'openapi: "3.0.0"', plugins: [] }

    await connectToStudio({ ...options, allowInput: true })

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate', payload }),
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
      data: JSON.stringify({ type: 'studio:generate', payload }),
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
      data: JSON.stringify({ type: 'studio:generate', payload: { plugins: [] } }),
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
      data: JSON.stringify({ type: 'studio:generate', payload: { plugins: [{ name: 'evil-module', options: {} }] } }),
    })

    expect(generate).not.toHaveBeenCalled()
    expect(session.errors().map((error) => error.message)).toContainEqual(expect.stringContaining('evil-module'))
  })

  // An adapter instance carries closures that cannot survive JSON, so the payload is an options
  // patch: the adapter factory is re-invoked with the merged options rather than replaced by the
  // plain object Studio sent.
  it('re-invokes the adapter factory with the payload options merged in', async () => {
    loadConfig.mockResolvedValueOnce(makeConfig({ adapter: { name: 'oas', options: { validate: true } } }) as any)
    const payload = { adapter: { server: { index: 1 } }, plugins: [] }

    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate', payload }),
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
      data: JSON.stringify({ type: 'studio:generate', payload }),
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
      data: JSON.stringify({ type: 'studio:generate' }),
    })

    // Wait until `generate()` is actually in flight (loadConfig/mergePlugins/etc. resolve
    // over several microtasks) before firing the second command, so it reliably lands
    // while the first generation is still running.
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1))

    const second = mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate' }),
    })

    resolveGenerate()
    await Promise.all([first, second])

    expect(generate).toHaveBeenCalledTimes(1)
    expect(session.warnings()).toContainEqual(expect.stringContaining('already in progress'))
  })

  it('allows a new generate command once the previous one has finished', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate' }),
    })
    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate' }),
    })

    expect(generate).toHaveBeenCalledTimes(2)
  })

  // The event stream is wired to the generation emitter only. The connection emitter carries just
  // `kubb:error`, so two generations can never interleave their events on one socket.
  it('uses an isolated hooks emitter for each generate command', async () => {
    await connectToStudio(options)

    await mockWs.trigger('message', {
      data: JSON.stringify({ type: 'studio:generate', payload: { plugins: [] } }),
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
      data: JSON.stringify({ type: 'studio:connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        type: 'agent:connect',
        payload: expect.objectContaining({
          versions: {
            kubb: '5.1.0-core-test',
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
      data: JSON.stringify({ type: 'studio:connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowWrite: true,
            allowConfigEdit: false,
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
      data: JSON.stringify({ type: 'studio:connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      mockWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowWrite: false,
            allowConfigEdit: false,
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
      data: JSON.stringify({ type: 'studio:connect' }),
    })

    expect(sendAgentMessage).toHaveBeenCalledWith(
      sandboxWs,
      expect.objectContaining({
        payload: expect.objectContaining({
          permissions: {
            allowWrite: false,
            allowConfigEdit: false,
            allowInput: true,
            allowExec: false,
          },
        }),
      }),
    )
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
      data: JSON.stringify({ type: 'studio:disconnect', reason: 'revoked' }),
    })

    expect(session.named('studio:disconnected')).toStrictEqual([{ name: 'studio:disconnected', ctx: { tag: 'brave-otter', reason: 'revoked' } }])
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
      data: JSON.stringify({ type: 'studio:disconnect', reason: 'expired' }),
    })

    expect(session.named('studio:disconnected')).toStrictEqual([{ name: 'studio:disconnected', ctx: { tag: 'brave-otter', reason: 'expired' } }])
    expect(mockWs.closed).toBe(true)
    expect(disconnect).not.toHaveBeenCalled()
    // expired sessions trigger a reconnect (unlike revoked)
    expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('Retrying connection'))
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

      expect(session.errors().map((error) => error.message)).toContainEqual(expect.stringContaining('502 Bad Gateway'))
      // the failed attempt schedules another reconnect rather than giving up
      await vi.advanceTimersByTimeAsync(options.retryInterval!)
      expect(createAgentSession).toHaveBeenCalledTimes(3)
      expect(unhandledRejections).toStrictEqual([])
    } finally {
      processEvents.off('unhandledRejection', onUnhandledRejection)
    }
  })
})
