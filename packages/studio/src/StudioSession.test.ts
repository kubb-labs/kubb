import { ast } from '@kubb/ast'
import { type Config, definePlugin, memoryStorage, type Plugin } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type AgentApi, AgentCloseCode, type RpcClose, type StudioApi } from './protocol/index.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(true),
  registerAgent: vi.fn().mockResolvedValue(true),
}))

vi.mock('../package.json', () => ({ version: '5.0.0-test' }))

// `fsStorage` is the project on disk: what a run granted allowWrite writes to, and what the agent
// snapshots before each run. Every call shares this one in-memory store instead, so a test can seed
// the disk and watch a run overwrite it. `readKeys` answers relative to the base like the real one.
const disk = vi.hoisted(() => ({
  storage: undefined as import('@kubb/core').Storage | undefined,
  cache: undefined as import('@kubb/core').Storage | undefined,
}))
vi.mock('@kubb/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@kubb/core')>()
  const createDisk = (): import('@kubb/core').Storage => {
    const store = core.memoryStorage()
    return {
      ...store,
      async readKeys(base?: string) {
        const keys = await store.readKeys(base)
        return base ? keys.map((key) => key.slice(base.length + 1)) : keys
      },
    }
  }
  return { ...core, fsStorage: () => (disk.storage ??= createDisk()), cacheStorage: () => (disk.cache ??= core.memoryStorage()) }
})

import { createAgentSession } from './api.ts'

const root = '/project'
const pluginName = 'studio-test-plugin'
const studioUrl = 'https://studio.test'

/**
 * A plugin that emits one file, so a run leaves something behind for `readFiles` and
 * `publishSnapshot` to work from. Storage keys are absolute, which is what the file manager writes
 * and what the session resolves a request against.
 */
function filePlugin(absolutePath: string, content: string): Plugin {
  const file = ast.factory.createFile({
    path: absolutePath,
    baseName: absolutePath.split('/').pop() as `${string}.${string}`,
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(content)] })],
    imports: [],
    exports: [],
  })

  return definePlugin(() => ({
    name: pluginName,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.injectFile(file)
      },
    },
  }))() as unknown as Plugin
}

/**
 * Stands in for Studio: opens a session over a fake connector, then calls `connect()` the way the
 * real Studio does to finish the handshake. Everything a test drives afterwards goes through the
 * same {@link AgentApi} Studio itself would hold.
 */
async function connectStudio(overrides: Partial<StudioSessionOptions> = {}): Promise<{
  session: StudioSession
  agent: AgentApi
  studio: StudioApi
  closeTransport: (close?: RpcClose) => void
}> {
  let agent: AgentApi | undefined
  let closeTransport: ((close?: RpcClose) => void) | undefined

  const studio: StudioApi = { ping: vi.fn().mockResolvedValue(undefined) }
  const session = new StudioSession({
    token: 'token',
    studioUrl,
    configPath: 'kubb.config.ts',
    version: '2.0.0',
    root,
    loadConfig: async () =>
      ({
        root,
        input: 'https://example.com/openapi.json',
        output: { path: 'src/gen', clean: false },
        parsers: [],
        reporters: [],
        adapter: createMockedAdapter(),
        plugins: [filePlugin(`${root}/src/gen/pet.ts`, 'export const pet = 1')],
        storage: memoryStorage(),
      }) as unknown as Config,
    ...overrides,
    connector: async ({ local }) => {
      agent = local
      const closed = new Promise<RpcClose | void>((resolve) => {
        closeTransport = resolve
      })
      return { studio, closed, close: vi.fn() }
    },
  })

  const started = session.start()
  await vi.waitFor(() => expect(agent).toBe(session))
  await agent?.connect()
  await started

  return { session, agent: agent as AgentApi, studio, closeTransport: (close?: RpcClose) => closeTransport?.(close) }
}

async function run(agent: AgentApi, jobId: string) {
  return agent.startGeneration({ jobId, config: {} }).result()
}

beforeEach(() => {
  vi.clearAllMocks()
  disk.storage = undefined
  disk.cache = undefined
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

describe('the handshake', () => {
  it('exposes the agent API to Studio once the socket is attached', async () => {
    const { agent } = await connectStudio()

    await expect(agent.connect()).resolves.toMatchObject({ root, versions: { agent: '2.0.0' } })
  })

  it('sends every permission off when the host granted none, even inside a CI job', async () => {
    vi.stubEnv('CI', 'true')
    vi.stubEnv('GITHUB_ACTIONS', 'true')

    try {
      const { agent } = await connectStudio()

      await expect(agent.connect()).resolves.toMatchObject({
        permissions: { allowWrite: false, allowInput: false, allowExec: false, allowConfigEdit: false, allowRead: false },
      })
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('emits studio:ready only after Studio calls connect()', async () => {
    const ready = vi.fn()
    await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:ready', ready) })

    expect(ready).toHaveBeenCalledOnce()
  })

  it('carries the agent and organization slug on studio:connected', async () => {
    vi.mocked(createAgentSession).mockResolvedValue({
      sessionId: 'session-1',
      slug: 'brave-otter',
      url: 'ws://studio/session-1',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      revokedAt: null,
      isSandbox: false,
      version: '1.0.0',
      agentSlug: 'brave-otter',
      organizationSlug: 'acme',
    })
    const connected = vi.fn()

    await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:connected', connected) })

    expect(connected).toHaveBeenCalledWith(expect.objectContaining({ agentSlug: 'brave-otter', organizationSlug: 'acme' }))
  })

  it('announces the retry through studio:reconnecting instead of printing it, backed off and jittered', async () => {
    using error = vi.spyOn(console, 'error').mockImplementation(() => {})
    using random = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const controller = new AbortController()
    const reconnecting = vi.fn()
    const { closeTransport } = await connectStudio({
      retryInterval: 60_000,
      signal: controller.signal,
      installLogger: (hooks) => void hooks.hook('studio:reconnecting', reconnecting),
    })

    closeTransport()

    await vi.waitFor(() => expect(reconnecting).toHaveBeenCalledWith({ delayMs: 500 }))
    expect(error).not.toHaveBeenCalled()
    expect(random).toHaveBeenCalled()
    controller.abort()
  })

  it('reports an RPC disconnect to lifecycle hooks', async () => {
    const disconnected = vi.fn()
    const { closeTransport } = await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:disconnected', disconnected) })

    closeTransport()

    await vi.waitFor(() => expect(disconnected).toHaveBeenCalledWith({ reason: 'connection closed' }))
  })
})

describe('close codes', () => {
  /**
   * Closes the transport with `code`, then waits until the session finished ending: the disconnect
   * notice is the last await before a reconnect would be scheduled.
   */
  async function closeWith(code: number) {
    const controller = new AbortController()
    const hooks = { disconnected: vi.fn(), reconnecting: vi.fn(), error: vi.fn() }
    const { closeTransport } = await connectStudio({
      signal: controller.signal,
      installLogger: (emitter) => {
        emitter.hook('studio:disconnected', hooks.disconnected)
        emitter.hook('studio:reconnecting', hooks.reconnecting)
        emitter.hook('studio:error', hooks.error)
      },
    })
    const { disconnect, registerAgent } = await import('./api.ts')
    vi.mocked(disconnect).mockClear()
    vi.mocked(registerAgent).mockClear()

    closeTransport({ code, reason: '' })
    await vi.waitFor(() => expect(disconnect).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 10))

    return { hooks, registerAgent: vi.mocked(registerAgent), stop: () => controller.abort() }
  }

  it('registers again, then reconnects, when Studio asks the agent to reauthenticate', async () => {
    const { hooks, registerAgent, stop } = await closeWith(AgentCloseCode.REAUTHENTICATE)

    expect(registerAgent).toHaveBeenCalledOnce()
    expect(hooks.reconnecting).toHaveBeenCalledOnce()
    stop()
  })

  it('stays down when another instance of the agent took over', async () => {
    const { hooks, stop } = await closeWith(AgentCloseCode.SUPERSEDED)

    expect(hooks.disconnected).toHaveBeenCalledWith({ reason: 'another instance of this agent took over' })
    expect(hooks.reconnecting).not.toHaveBeenCalled()
    stop()
  })

  it('stops and says what to do when the agent is too old for Studio or was deleted', async () => {
    const { hooks, stop } = await closeWith(AgentCloseCode.INCOMPATIBLE)

    expect(hooks.error).toHaveBeenCalledWith({ error: expect.objectContaining({ message: expect.stringContaining('Upgrade the agent, or pair it again') }) })
    expect(hooks.reconnecting).not.toHaveBeenCalled()
    stop()
  })

  it('reconnects on any other code, as before', async () => {
    const { hooks, registerAgent, stop } = await closeWith(1006)

    expect(hooks.reconnecting).toHaveBeenCalledOnce()
    expect(registerAgent).not.toHaveBeenCalled()
    stop()
  })
})

describe('startGeneration', () => {
  it('ignores a spec from Studio when the host did not grant allowInput, and names the permission', async () => {
    const warn = vi.fn()
    const { agent } = await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:warn', warn) })

    await agent.startGeneration({ jobId: 'job-1', config: { input: 'openapi: 3.1.0' } }).result()

    expect(warn).toHaveBeenCalledWith({ message: expect.stringContaining('Ignored the spec from Studio'), permission: 'allowInput' })
  })
})

describe('load', () => {
  it('reports what the agent is carrying with each heartbeat', async () => {
    const controller = new AbortController()
    const { studio } = await connectStudio({ heartbeatInterval: 10, signal: controller.signal })

    await vi.waitFor(() => expect(studio.ping).toHaveBeenCalledWith({ running: 0, rssMb: expect.any(Number), storeBytes: 0, accepting: true }))
    controller.abort()
  })

  it('refuses a generation once memory is past the budget, and says so in the heartbeat', async () => {
    const controller = new AbortController()
    // A 1 MB budget puts any real process far past the 1.5 MB watermark.
    const { agent, studio } = await connectStudio({ heartbeatInterval: 10, signal: controller.signal, capacity: { memoryBudgetMb: 1 } })

    await expect(run(agent, 'job-1')).rejects.toThrow('The agent is past its memory budget')
    await vi.waitFor(() => expect(studio.ping).toHaveBeenCalledWith(expect.objectContaining({ accepting: false })))
    controller.abort()
  })
})

describe('cancel', () => {
  it('does nothing when no job is running', async () => {
    const { agent } = await connectStudio()

    await expect(agent.cancel('job-1')).resolves.toBeUndefined()
  })

  it('leaves the running job alone when asked to cancel a different id', async () => {
    const { agent } = await connectStudio()
    const run = agent.startGeneration({ jobId: 'job-1', config: {} })

    await agent.cancel('job-2')

    await expect(run.result()).resolves.toMatchObject({ status: 'success' })
  })
})

describe('readFiles', () => {
  it('refuses to read when the host did not grant allowRead, and names the permission for the host', async () => {
    const warn = vi.fn()
    const { agent } = await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:warn', warn) })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).rejects.toThrow('The agent was not granted permission to read generated files')
    expect(warn).toHaveBeenCalledWith({ message: expect.stringContaining('not granted'), permission: 'allowRead' })
  })

  it('returns only the paths the run produced, so a request cannot escape the output', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['../../etc/passwd', 'src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1' },
    })
  })
})

describe('generation history', () => {
  /**
   * Emits `pet.ts` with whatever `content.current` holds when a run loads its config, so a test
   * sets it before each run to make two runs differ.
   */
  function changingConfig(): { content: { current: string }; overrides: Partial<StudioSessionOptions> } {
    const content = { current: '' }
    return {
      content,
      overrides: {
        loadConfig: async () =>
          ({
            root,
            input: 'https://example.com/openapi.json',
            output: { path: 'src/gen', clean: false },
            parsers: [],
            reporters: [],
            adapter: createMockedAdapter(),
            plugins: [filePlugin(`${root}/src/gen/pet.ts`, content.current)],
            storage: memoryStorage(),
          }) as unknown as Config,
      },
    }
  }

  it('fingerprints every file in the run result', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })

    const result = await run(agent, 'job-1')

    expect(result.hashes).toStrictEqual({ 'src/gen/pet.ts': expect.stringMatching(/^[0-9a-f]{16}$/) })
  })

  it('reads the last job after the agent restarts, from the project cache', async () => {
    const first = await connectStudio({ permissions: { allowRead: true } })
    await run(first.agent, 'job-1')

    const { agent } = await connectStudio({ permissions: { allowRead: true } })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 1' } })
  })

  it('reads an earlier job after a later one ran', async () => {
    const { content, overrides } = changingConfig()
    const { agent } = await connectStudio({ permissions: { allowRead: true }, ...overrides })
    content.current = 'export const pet = 1'
    await run(agent, 'job-1')
    content.current = 'export const pet = 2'
    await run(agent, 'job-2')

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 1' } })
    await expect(agent.readFiles({ jobId: 'job-2', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 2' } })
  })
})

describe('disk snapshot', () => {
  async function seedDisk(files: Record<string, string>) {
    const { fsStorage } = await import('@kubb/core')
    const storage = fsStorage()
    for (const [path, value] of Object.entries(files)) await storage.writeItem(`${root}/${path}`, value)
  }

  it('fingerprints what the output directory held before the run', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'on disk', 'src/gen/old.ts': 'stale', 'src/other.ts': 'not output' })
    const { agent } = await connectStudio({ permissions: { allowRead: true } })

    const result = await run(agent, 'job-1')

    expect(Object.keys(result.disk?.hashes ?? {}).toSorted()).toStrictEqual(['src/gen/old.ts', 'src/gen/pet.ts'])
    expect(result.disk?.hashes['src/gen/pet.ts']).not.toBe(result.hashes['src/gen/pet.ts'])
  })

  it('reads a job against the disk it ran over', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'on disk' })
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await run(agent, 'job-1')

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts', 'src/other.ts'], source: 'disk' })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'on disk' },
    })
  })
})

describe('saveConfig', () => {
  it('refuses every edit when the host did not grant allowConfigEdit', async () => {
    const { agent } = await connectStudio()
    const edits = [{ kind: 'plugin', name: '@kubb/plugin-ts', options: {} }] as unknown as Parameters<AgentApi['saveConfig']>[0]['edits']

    await expect(agent.saveConfig({ edits })).resolves.toStrictEqual({
      outcomes: [{ edit: edits[0], applied: false, reason: 'the agent was not granted permission to edit kubb.config.ts' }],
      changed: false,
    })
  })
})

describe('publishSnapshot', () => {
  const input = { name: 'pkg', version: '1.0.0', bundledDependencies: [pluginName], uploadPath: '/snapshots/1' }

  async function generated(): Promise<AgentApi> {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()
    return agent
  }

  it('refuses an upload path that points off the Studio origin', async () => {
    const agent = await generated()
    using fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(agent.publishSnapshot({ ...input, uploadPath: 'https://evil.test/steal' })).rejects.toThrow(
      'Snapshot upload path must stay on the Studio origin',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a plaintext storage URL the redirect points at', async () => {
    const agent = await generated()
    using _ = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 307, headers: { location: 'http://evil.test/bucket' } }))

    await expect(agent.publishSnapshot(input)).rejects.toThrow('Refusing snapshot upload to http://evil.test')
  })

  it('PUTs the package to the storage URL without the Studio bearer token', async () => {
    const agent = await generated()
    using fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 307, headers: { location: 'https://storage.test/bucket/1' } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    await expect(agent.publishSnapshot(input)).resolves.toMatchObject({ integrity: expect.stringContaining('sha') })

    const [uploadUrl, uploadInit] = fetchMock.mock.calls[1] as [URL, RequestInit]
    expect(uploadUrl.href).toBe('https://storage.test/bucket/1')
    expect(uploadInit.headers).toBeUndefined()
  })
})
