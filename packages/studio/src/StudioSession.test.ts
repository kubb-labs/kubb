import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ast } from '@kubb/ast'
import { type Config, definePlugin, memoryStorage, type Plugin } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { agentDefaults } from './constants.ts'
import { MAX_FILES_PER_REQUEST, type AgentApi, type StudioApi } from './protocol/index.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

vi.mock('./api.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api.ts')>()),
  createAgentSession: vi.fn(),
  disconnect: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../package.json', () => ({ version: '5.0.0-test' }))

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
 * A plugin whose `kubb:plugin:start` throws, turning the run into an error diagnostic. The driver
 * catches this per-plugin and keeps going, so a run with this plugin alongside {@link filePlugin}
 * still writes that file and still reports `status: 'failed'` — the case where a run produces real
 * output but still counts as a failure.
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

beforeEach(() => {
  vi.clearAllMocks()
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
  it('disposing the run cancels it instead of leaving an unhandled rejection', async () => {
    const { agent } = await connectStudio()

    const run = agent.startGeneration({ jobId: 'job-1', config: {} })
    // Stands in for capnweb disposing the stub, without a round trip.
    ;(run as unknown as Disposable)[Symbol.dispose]()

    await expect(run.result()).rejects.toThrow('Generation canceled')
  })
})

/**
 * A `loadConfig` whose output is whatever `files` holds when a run loads it. The handshake loads
 * the config too, so a test swaps `files` between runs rather than counting calls.
 */
function mutableConfig(
  initial: Record<string, string>,
  configRoot = root,
): { loadConfig: StudioSessionOptions['loadConfig']; setFiles: (files: Record<string, string>) => void } {
  let files = initial
  return {
    setFiles: (next) => {
      files = next
    },
    loadConfig: async () =>
      ({
        root: configRoot,
        input: 'https://example.com/openapi.json',
        output: { path: 'src/gen', clean: false },
        parsers: [],
        reporters: [],
        adapter: createMockedAdapter(),
        plugins: Object.entries(files).map(([path, content], index) => ({ ...filePlugin(`${configRoot}/${path}`, content), name: `${pluginName}-${index}` })),
        storage: memoryStorage(),
      }) as unknown as Config,
  }
}

describe('generation changes', () => {
  it('reports nothing on the first run', async () => {
    const { agent } = await connectStudio()

    const result = await agent.startGeneration({ jobId: 'job-1', config: {} }).result()

    expect(result.changes).toBeUndefined()
  })

  it('reports added, changed, and removed files against the previous run, and leaves unchanged ones out', async () => {
    const config = mutableConfig({ 'src/gen/pet.ts': 'v1', 'src/gen/order.ts': 'same', 'src/gen/store.ts': 'gone' })
    const { agent } = await connectStudio({ loadConfig: config.loadConfig })

    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()
    config.setFiles({ 'src/gen/pet.ts': 'v2', 'src/gen/order.ts': 'same', 'src/gen/owner.ts': 'new' })
    const result = await agent.startGeneration({ jobId: 'job-2', config: {} }).result()

    expect(result.changes).toStrictEqual({ 'src/gen/pet.ts': 'changed', 'src/gen/owner.ts': 'added', 'src/gen/store.ts': 'removed' })
  })

  it('keeps the previous run of a written-to-disk session, even though the new run overwrites it', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'kubb-studio-'))
    try {
      const config = mutableConfig({ 'src/gen/pet.ts': 'v1' }, dir)
      const { agent } = await connectStudio({ root: dir, permissions: { allowRead: true, allowWrite: true }, loadConfig: config.loadConfig })

      await agent.startGeneration({ jobId: 'job-1', config: {} }).result()
      config.setFiles({ 'src/gen/pet.ts': 'v2' })
      const result = await agent.startGeneration({ jobId: 'job-2', config: {} }).result()

      expect(await readFile(path.join(dir, 'src/gen/pet.ts'), 'utf8')).toBe('v2\n')
      expect(result.changes).toStrictEqual({ 'src/gen/pet.ts': 'changed' })
      await expect(agent.readFiles({ paths: ['src/gen/pet.ts'], revision: 'previous' })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'v1\n' } })
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('compares with the last successful run when a run in between fails', async () => {
    const config = mutableConfig({ 'src/gen/pet.ts': 'v1' })
    let fail = false
    const { agent } = await connectStudio({
      loadConfig: async () => {
        if (fail) throw new Error('config broke')
        return config.loadConfig()
      },
    })

    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()
    config.setFiles({ 'src/gen/pet.ts': 'v2' })
    fail = true
    await expect(agent.startGeneration({ jobId: 'job-2', config: {} }).result()).rejects.toThrow('config broke')
    fail = false
    const result = await agent.startGeneration({ jobId: 'job-3', config: {} }).result()

    expect(result.changes).toStrictEqual({ 'src/gen/pet.ts': 'changed' })
  })

  it('does not promote a run that failed after writing files, even though it produced output', async () => {
    // Unlike the config-throws case above, this run reaches `generate()` and writes a file before
    // a second plugin fails it: `kubb:generation:end` still fires for it, with `status: 'failed'`.
    let run = 1
    const { agent } = await connectStudio({
      loadConfig: async () => ({
        root,
        input: 'https://example.com/openapi.json',
        output: { path: 'src/gen', clean: false },
        parsers: [],
        reporters: [],
        adapter: createMockedAdapter(),
        plugins: run === 1 ? [filePlugin(`${root}/src/gen/pet.ts`, 'v1')] : [filePlugin(`${root}/src/gen/pet.ts`, 'v2'), failingPlugin()],
        storage: memoryStorage(),
      }),
    })

    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()
    run = 2
    await expect(agent.startGeneration({ jobId: 'job-2', config: {} }).result()).rejects.toThrow()
    run = 1
    const result = await agent.startGeneration({ jobId: 'job-3', config: {} }).result()

    // Compares against job-1's output (unchanged), not job-2's failed 'v2' (which would read as
    // 'changed' back to 'v1').
    expect(result.changes).toStrictEqual({})
  })
})

describe('readFiles', () => {
  it('refuses to read when the host did not grant allowRead', async () => {
    const { agent } = await connectStudio()

    await expect(agent.readFiles({ paths: ['src/gen/pet.ts'] })).rejects.toThrow(/not granted permission to read generated files.*KUBB_AGENT_ALLOW_READ=true/)
  })

  it('refuses more paths than one request may carry', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    const paths = Array.from({ length: MAX_FILES_PER_REQUEST + 1 }, (_, index) => `src/gen/file${index}.ts`)

    await expect(agent.readFiles({ paths })).rejects.toThrow(`At most ${MAX_FILES_PER_REQUEST} paths may be requested at once`)
  })

  it('returns only the paths the run produced, so a request cannot escape the output', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()

    await expect(agent.readFiles({ paths: ['../../etc/passwd', 'src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1' },
    })
  })

  it('reads the previous run, including files the latest run removed', async () => {
    const config = mutableConfig({ 'src/gen/pet.ts': 'v1', 'src/gen/store.ts': 'gone' })
    const { agent } = await connectStudio({ permissions: { allowRead: true }, loadConfig: config.loadConfig })
    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()
    config.setFiles({ 'src/gen/pet.ts': 'v2' })
    await agent.startGeneration({ jobId: 'job-2', config: {} }).result()

    await expect(agent.readFiles({ paths: ['src/gen/pet.ts', 'src/gen/store.ts', 'src/gen/other.ts'], revision: 'previous' })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'v1', 'src/gen/store.ts': 'gone' },
    })
    await expect(agent.readFiles({ paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'v2' } })
  })

  it('refuses the previous revision before a second run', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await agent.startGeneration({ jobId: 'job-1', config: {} }).result()

    await expect(agent.readFiles({ paths: ['src/gen/pet.ts'], revision: 'previous' })).rejects.toThrow('No previous generation to compare against')
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
