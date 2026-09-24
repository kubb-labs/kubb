import { ast } from '@kubb/ast'
import { type Config, definePlugin, memoryStorage, type Plugin } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { agentDefaults } from './constants.ts'
import { GENERATION_GONE_MESSAGE, MAX_FILES_PER_REQUEST, type AgentApi, type ReadFilesInput, type StudioApi } from './protocol/index.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(true),
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

import { createAgentSession, disconnect } from './api.ts'

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
 * A plugin that fails a run after it started, so `kubb:generation:end` still fires for it.
 */
function failingPlugin(): Plugin {
  return definePlugin(() => ({
    name: 'studio-failing-plugin',
    hooks: {
      'kubb:plugin:start'() {
        throw new Error('plugin exploded')
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
  closeTransport: () => void
}> {
  let agent: AgentApi | undefined
  let closeTransport: (() => void) | undefined

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
      const closed = new Promise<void>((resolve) => {
        closeTransport = resolve
      })
      return { studio, closed, close: vi.fn() }
    },
  })

  const started = session.start()
  await vi.waitFor(() => expect(agent).toBe(session))
  await agent?.connect()
  await started

  return { session, agent: agent as AgentApi, closeTransport: () => closeTransport?.() }
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

  it('reports a startup warning once the host logger is installed', async () => {
    const warn = vi.fn()
    await connectStudio({ startupWarning: 'Could not register', installLogger: (hooks) => void hooks.hook('studio:warn', warn) })

    expect(warn).toHaveBeenCalledExactlyOnceWith({ message: 'Could not register', permission: undefined })
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

  it('leaves the slugs undefined when Studio omits them', async () => {
    const connected = vi.fn()

    await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:connected', connected) })

    expect(connected).toHaveBeenCalledWith(expect.objectContaining({ agentSlug: undefined, organizationSlug: undefined }))
  })

  it('reports the current slug on a reconnect, not a stale one', async () => {
    vi.mocked(createAgentSession).mockResolvedValueOnce({
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
    await connectStudio()

    vi.mocked(createAgentSession).mockResolvedValueOnce({
      sessionId: 'session-2',
      slug: 'quiet-fox',
      url: 'ws://studio/session-2',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      revokedAt: null,
      isSandbox: false,
      version: '1.0.0',
      agentSlug: 'quiet-fox',
      organizationSlug: 'acme',
    })
    const reconnected = vi.fn()

    await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:connected', reconnected) })

    expect(reconnected).toHaveBeenCalledWith(expect.objectContaining({ agentSlug: 'quiet-fox' }))
  })

  it('announces the retry through studio:reconnecting instead of printing it', async () => {
    using error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const controller = new AbortController()
    const reconnecting = vi.fn()
    const { closeTransport } = await connectStudio({
      retryInterval: 60_000,
      signal: controller.signal,
      installLogger: (hooks) => void hooks.hook('studio:reconnecting', reconnecting),
    })

    closeTransport()

    await vi.waitFor(() => expect(reconnecting).toHaveBeenCalledWith({ delayMs: 60_000 }))
    expect(error).not.toHaveBeenCalled()
    controller.abort()
  })

  it('warns through studio:warn when Studio could not be told about the disconnect', async () => {
    vi.mocked(disconnect).mockResolvedValueOnce(false)
    const controller = new AbortController()
    const warn = vi.fn()
    const { closeTransport } = await connectStudio({
      retryInterval: 60_000,
      signal: controller.signal,
      installLogger: (hooks) => void hooks.hook('studio:warn', warn),
    })

    closeTransport()

    await vi.waitFor(() => expect(warn).toHaveBeenCalledWith(expect.objectContaining({ message: 'Could not notify Kubb Studio of the disconnect' })))
    controller.abort()
  })

  it('reports an RPC disconnect to lifecycle hooks', async () => {
    const disconnected = vi.fn()
    const { closeTransport } = await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:disconnected', disconnected) })

    closeTransport()

    await vi.waitFor(() => expect(disconnected).toHaveBeenCalledWith({ reason: 'connection closed' }))
  })

  it('closes the session when a heartbeat ping never settles', async () => {
    vi.useFakeTimers()

    try {
      const disconnected = vi.fn()
      const { promise: closed, resolve: resolveClosed } = Promise.withResolvers<void>()
      const close = vi.fn(() => resolveClosed())
      const ping = vi.fn((): Promise<void> => new Promise(() => {}))
      const { promise: agentReady, resolve: onAgentReady } = Promise.withResolvers<AgentApi>()

      const started = new StudioSession({
        token: 'token',
        studioUrl,
        configPath: 'kubb.config.ts',
        version: '2.0.0',
        root,
        heartbeatInterval: 1_000,
        loadConfig: async () => ({ plugins: [] }) as unknown as Config,
        installLogger: (hooks) => void hooks.hook('studio:disconnected', disconnected),
        connector: async ({ local }) => {
          onAgentReady(local)
          return { studio: { ping }, closed, close }
        },
      }).start()

      const agent = await agentReady
      await agent.connect()
      await started

      // Fires the heartbeat timer, then lets its deadline elapse without the ping settling.
      await vi.advanceTimersByTimeAsync(1_000)
      await vi.advanceTimersByTimeAsync(agentDefaults.heartbeatTimeoutMs)

      // Called at least once by the failed heartbeat, and again by the disconnect it triggers.
      expect(close).toHaveBeenCalled()
      expect(disconnected).toHaveBeenCalledWith({ reason: 'connection closed' })
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('startGeneration', () => {
  it('ignores a spec from Studio when the host did not grant allowInput, and names the permission', async () => {
    const warn = vi.fn()
    const { agent } = await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:warn', warn) })

    await agent.startGeneration({ jobId: 'job-1', config: { input: 'openapi: 3.1.0' } }).result()

    expect(warn).toHaveBeenCalledWith({ message: expect.stringContaining('Ignored the spec from Studio'), permission: 'allowInput' })
  })

  it('disposing the run cancels it instead of leaving an unhandled rejection', async () => {
    const { agent } = await connectStudio()

    const run = agent.startGeneration({ jobId: 'job-1', config: {} })
    // Stands in for capnweb disposing the stub, without a round trip.
    ;(run as unknown as Disposable)[Symbol.dispose]()

    await expect(run.result()).rejects.toThrow('Generation canceled')
  })
})

describe('readFiles', () => {
  it('refuses to read when the host did not grant allowRead, and names the permission for the host', async () => {
    const warn = vi.fn()
    const { agent } = await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:warn', warn) })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).rejects.toThrow('The agent was not granted permission to read generated files')
    expect(warn).toHaveBeenCalledWith({ message: expect.stringContaining('not granted'), permission: 'allowRead' })
  })

  it('refuses more paths than one request may carry', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    const paths = Array.from({ length: MAX_FILES_PER_REQUEST + 1 }, (_, index) => `src/gen/file${index}.ts`)

    await expect(agent.readFiles({ jobId: 'job-1', paths })).rejects.toThrow(`At most ${MAX_FILES_PER_REQUEST} paths may be requested at once`)
  })

  it('refuses a request that names no job', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })

    await expect(agent.readFiles({ paths: ['src/gen/pet.ts'] } as unknown as ReadFilesInput)).rejects.toThrow('The request named no generation job')
  })

  it('returns only the paths the run produced, so a request cannot escape the output', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['../../etc/passwd', 'src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1' },
    })
  })

  it('fails for a job the agent never ran or no longer keeps', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()

    await expect(agent.readFiles({ jobId: 'job-other', paths: ['src/gen/pet.ts'] })).rejects.toThrow(GENERATION_GONE_MESSAGE)
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

  it('gives unchanged content the same hash across runs, and changed content a new one', async () => {
    const { content, overrides } = changingConfig()
    const { agent } = await connectStudio({ permissions: { allowRead: true }, ...overrides })

    content.current = 'a'
    const first = await run(agent, 'job-1')
    const second = await run(agent, 'job-2')
    content.current = 'b'
    const third = await run(agent, 'job-3')

    expect(second.hashes).toStrictEqual(first.hashes)
    expect(third.hashes['src/gen/pet.ts']).not.toBe(second.hashes['src/gen/pet.ts'])
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

  it('keeps an earlier job written to disk readable after the next job overwrites it', async () => {
    const { content, overrides } = changingConfig()
    const { agent } = await connectStudio({ permissions: { allowRead: true, allowWrite: true }, ...overrides })
    content.current = 'export const pet = 1'
    await run(agent, 'job-1')
    content.current = 'export const pet = 2'
    await run(agent, 'job-2')

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 1' } })
  })

  it('does not keep a job whose config failed to load, and leaves earlier jobs readable', async () => {
    const { content, overrides } = changingConfig()
    let fail = false
    const loadConfig = overrides.loadConfig!
    const { agent } = await connectStudio({
      permissions: { allowRead: true },
      loadConfig: async () => {
        if (fail) throw new Error('config broke')
        return loadConfig()
      },
    })
    content.current = 'v1'
    await run(agent, 'job-1')
    fail = true
    await expect(run(agent, 'job-2')).rejects.toThrow('config broke')

    await expect(agent.readFiles({ jobId: 'job-2', paths: ['src/gen/pet.ts'] })).rejects.toThrow(GENERATION_GONE_MESSAGE)
    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'v1' } })
  })

  it('does not keep a job that failed after writing files, and keeps the earlier job as it was', async () => {
    let failing = false
    const { agent } = await connectStudio({
      permissions: { allowRead: true, allowWrite: true },
      loadConfig: async () =>
        ({
          root,
          input: 'https://example.com/openapi.json',
          output: { path: 'src/gen', clean: false },
          parsers: [],
          reporters: [],
          adapter: createMockedAdapter(),
          plugins: failing ? [filePlugin(`${root}/src/gen/pet.ts`, 'v2'), failingPlugin()] : [filePlugin(`${root}/src/gen/pet.ts`, 'v1')],
          storage: memoryStorage(),
        }) as unknown as Config,
    })
    await run(agent, 'job-1')
    failing = true
    await expect(run(agent, 'job-2')).rejects.toThrow()

    await expect(agent.readFiles({ jobId: 'job-2', paths: ['src/gen/pet.ts'] })).rejects.toThrow(GENERATION_GONE_MESSAGE)
    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'v1' } })
  })

  it('drops the oldest jobs once it keeps too many', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    for (let index = 1; index <= 9; index++) await run(agent, `job-${index}`)

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).rejects.toThrow(GENERATION_GONE_MESSAGE)
    await expect(agent.readFiles({ jobId: 'job-9', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 1' } })
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

  it('keeps the disk as it was when the run itself writes over it', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'on disk' })
    const { agent } = await connectStudio({ permissions: { allowRead: true, allowWrite: true } })
    await run(agent, 'job-1')

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'], source: 'disk' })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'on disk' },
    })
    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 1' } })
  })

  it('takes no snapshot on a sandbox agent, which has no project', async () => {
    vi.mocked(createAgentSession).mockResolvedValueOnce({
      sessionId: 'session-1',
      slug: 'brave-otter',
      url: 'ws://studio/session-1',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      revokedAt: null,
      isSandbox: true,
      version: '1.0.0',
    })
    await seedDisk({ 'src/gen/pet.ts': 'on disk' })
    const { agent } = await connectStudio()

    // A sandbox agent always generates from the spec Studio sends.
    const result = await agent.startGeneration({ jobId: 'job-1', config: { input: 'openapi: 3.1.0' } }).result()

    expect(result.disk).toBeUndefined()
    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'], source: 'disk' })).rejects.toThrow('kept no snapshot of the files on disk')
    // Pool sessions run every tenant's jobs, so nothing of theirs goes to a shared cache on disk.
    expect(disk.cache).toBeUndefined()
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
