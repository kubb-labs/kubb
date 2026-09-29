import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ast } from '@kubb/ast'
import { type Config, definePlugin, memoryStorage, type Plugin, resolveCacheDir } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type AgentApi, AgentCloseCode, type RpcClose, type StudioApi } from '../protocol/index.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

vi.mock('../operations/api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../operations/api.ts')>()),
  registerAgent: vi.fn(),
}))

vi.mock('../../package.json', () => ({ version: '5.0.0-test' }))

// Recorded but real, so a sandbox run's job root can be checked without faking the filesystem.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return { ...actual, mkdtemp: vi.fn(actual.mkdtemp), rm: vi.fn(actual.rm) }
})

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

import { IncompatibleAgentError, registerAgent } from '../operations/api.ts'

const root = '/project'
const pluginName = 'studio-test-plugin'
const studioUrl = 'https://studio.test'
const sessions: Array<StudioSession> = []
afterEach(async () => {
  await Promise.all(sessions.splice(0).map((session) => session.dispose()))
})

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

  sessions.push(session)
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
  vi.mocked(registerAgent).mockResolvedValue({
    socketUrl: 'ws://studio/api/agent/socket',
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
        permissions: { allowWrite: false, allowExec: false, allowConfigEdit: false, allowRead: false },
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
    vi.mocked(registerAgent).mockResolvedValue({
      socketUrl: 'ws://studio/api/agent/socket',
      isSandbox: false,
      version: '1.0.0',
      agentSlug: 'brave-otter',
      organizationSlug: 'acme',
    })
    const connected = vi.fn()

    await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:connected', connected) })

    expect(connected).toHaveBeenCalledWith(expect.objectContaining({ agentSlug: 'brave-otter', organizationSlug: 'acme' }))
  })

  it('reports an RPC disconnect to lifecycle hooks', async () => {
    const disconnected = vi.fn()
    const { closeTransport } = await connectStudio({ installLogger: (hooks) => void hooks.hook('studio:disconnected', disconnected) })

    closeTransport()

    await vi.waitFor(() => expect(disconnected).toHaveBeenCalledWith({ reason: 'connection closed' }))
  })
})

describe('close codes', () => {
  it('settles a closed session when a disconnect hook throws', async () => {
    const { session, closeTransport } = await connectStudio({
      installLogger: (hooks) =>
        void hooks.hook('studio:disconnected', () => {
          throw new Error('Reporter failed')
        }),
    })
    closeTransport()
    await expect(session.closed).resolves.toMatchObject({ retry: true })
  })

  it.each([
    [AgentCloseCode.REAUTHENTICATE, true],
    [AgentCloseCode.SUPERSEDED, false],
    [AgentCloseCode.INCOMPATIBLE, false],
    [1006, true],
  ])('reports whether close code %s should retry', async (code, retry) => {
    const { session, closeTransport } = await connectStudio()
    closeTransport({ code, reason: '' })
    await expect(session.closed).resolves.toMatchObject({ retry })
    expect(registerAgent).toHaveBeenCalledOnce()
  })
})

describe('registration', () => {
  it('opens the socket Studio registered this process for, with its instance id', async () => {
    const connector = vi.fn(async () => ({ studio: { ping: vi.fn().mockResolvedValue(undefined) }, closed: new Promise<void>(() => {}), close: vi.fn() }))
    const session = new StudioSession({
      token: 'token',
      studioUrl,
      configPath: 'kubb.config.ts',
      version: '2.0.0',
      root,
      loadConfig: vi.fn(),
      instanceId: 'instance-1',
      connector,
    })
    sessions.push(session)
    void session.start().catch(() => {})

    await vi.waitFor(() =>
      expect(connector).toHaveBeenCalledWith(expect.objectContaining({ url: 'ws://studio/api/agent/socket', token: 'token', instanceId: 'instance-1' })),
    )
    expect(registerAgent).toHaveBeenCalledWith(expect.objectContaining({ token: 'token', studioUrl, instanceId: 'instance-1' }))
    await session.dispose()
  })

  it('advertises one job at a time and warns when the host asked for more', async () => {
    const warn = vi.fn()
    await connectStudio({ capacity: { maxConcurrent: 2 }, installLogger: (hooks) => void hooks.hook('studio:warn', warn) })

    expect(registerAgent).toHaveBeenCalledWith(expect.objectContaining({ capacity: expect.objectContaining({ maxConcurrent: 1 }) }))
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('KUBB_AGENT_MAX_CONCURRENT=2') }))
  })

  it('stops instead of retrying when Studio needs a newer agent', async () => {
    vi.mocked(registerAgent).mockRejectedValue(new IncompatibleAgentError(studioUrl, 'agent 5.3.0 is below 5.4.0'))
    const reconnecting = vi.fn()
    const session = new StudioSession({
      token: 'token',
      studioUrl,
      configPath: 'kubb.config.ts',
      version: '2.0.0',
      root,
      loadConfig: vi.fn(),
      installLogger: (hooks) => void hooks.hook('studio:reconnecting', reconnecting),
    })

    await expect(session.start()).rejects.toBeInstanceOf(IncompatibleAgentError)
    expect(reconnecting).not.toHaveBeenCalled()
  })
})

describe('a sandbox job', () => {
  it('runs under its own temporary root, removed with its manifest cache once the job ends', async () => {
    vi.mocked(registerAgent).mockResolvedValue({
      socketUrl: 'ws://studio/api/agent/socket',
      isSandbox: true,
      version: '1.0.0',
    })
    const { mkdtemp, rm } = await import('node:fs/promises')
    const { agent } = await connectStudio()

    // A sandbox always generates from the spec Studio sends.
    await agent.startGeneration({ jobId: 'job-1', config: { input: 'openapi: 3.1.0' } }).result()

    const jobRoot = await vi.mocked(mkdtemp).mock.results[0]?.value
    expect(jobRoot).toContain(join(tmpdir(), 'kubb-job-'))
    expect(vi.mocked(rm)).toHaveBeenCalledWith(jobRoot, { recursive: true, force: true })
    expect(vi.mocked(rm)).toHaveBeenCalledWith(resolveCacheDir(jobRoot), { recursive: true, force: true })
  })

  it('leaves a local agent on its own root', async () => {
    const { mkdtemp } = await import('node:fs/promises')
    vi.mocked(mkdtemp).mockClear()
    const { agent } = await connectStudio()

    await run(agent, 'job-1')

    expect(vi.mocked(mkdtemp)).not.toHaveBeenCalled()
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

describe('disconnect during generation', () => {
  it('waits for the canceled run before releasing the session', async () => {
    const config: Config = { root, plugins: [], parsers: [], reporters: [], storage: memoryStorage(), output: { path: 'gen' }, input: 'spec.yaml' }
    const loaded = Promise.withResolvers<Config>()
    const loadConfig = vi
      .fn()
      .mockResolvedValueOnce(config)
      .mockImplementationOnce(() => loaded.promise)
    const { session, agent, closeTransport } = await connectStudio({ loadConfig })
    const generation = run(agent, 'interrupted').catch(() => {})
    await vi.waitFor(() => expect(loadConfig).toHaveBeenCalledTimes(2))
    await expect(run(agent, 'duplicate')).rejects.toThrow('already in progress')
    let closed = false
    void session.closed.then(() => {
      closed = true
    })
    closeTransport()
    await Promise.resolve()
    expect(closed).toBe(false)
    loaded.resolve(config)
    await generation
    await session.closed
    expect(closed).toBe(true)
    await expect(run(agent, 'late')).rejects.toThrow('Connection is closed')
  })
})
