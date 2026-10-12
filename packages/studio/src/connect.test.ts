import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer, type IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type Config, fsStorage, Hookable, type KubbHooks, resolveCacheDir, type Storage } from '@kubb/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ConnectAgentOptions, connectAgent, IncompatibleAgentError, InvalidAgentTokenError, type OpenRpc, runAgent } from './connect.ts'
import { AGENT_INSTANCE_HEADER, type AgentApi, AgentCloseCode, type AgentConnectInfo, MAX_PAGE_LINES } from './protocol.ts'
import { projectConfig, root } from './testing.ts'

vi.mock('../package.json', () => ({ version: '5.0.0-test' }))

// Reconnects wait for nothing, so a test sees the next socket straight away.
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(async () => {}) }))

// Recorded but real, so a sandbox run's job root can be checked without faking the filesystem.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return { ...actual, mkdtemp: vi.fn(actual.mkdtemp), rm: vi.fn(actual.rm) }
})

// One shared in-memory store stands in for the project on disk, so a test can seed it and watch a run.
const disk = vi.hoisted(() => ({
  storage: undefined as Storage | undefined,
  cache: undefined as Storage | undefined,
}))
vi.mock('@kubb/core', async (importOriginal) => {
  const core = await importOriginal<typeof import('@kubb/core')>()
  const createDisk = (): Storage => {
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

const studioUrl = 'https://studio.test'
const info: AgentConnectInfo = { sandbox: false, agentSlug: 'brave-otter', organizationSlug: 'acme', studioVersion: '1.0.0' }
const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()))
})

beforeEach(() => {
  vi.clearAllMocks()
  disk.storage = undefined
  disk.cache = undefined
})

type Socket = { agent: AgentApi; ping: ReturnType<typeof vi.fn>; close: (code: number, reason?: string) => void }

// Stands in for Studio: each socket lands in `sockets`, and a test closes it with Studio's code.
function startAgent(overrides: Partial<ConnectAgentOptions> = {}) {
  const sockets: Array<Socket> = []
  const openRpc: OpenRpc = ({ agent }) => {
    const closed = Promise.withResolvers<{ code: number; reason: string }>()
    const ping = vi.fn().mockResolvedValue(undefined)
    sockets.push({ agent, ping, close: (code, reason = '') => closed.resolve({ code, reason }) })
    return { studio: { ping }, closed: closed.promise, close: () => closed.resolve({ code: 1000, reason: '' }) }
  }
  const shutdown = new AbortController()
  const done = runAgent({
    options: {
      token: 'token',
      studioUrl,
      configPath: 'kubb.config.ts',
      version: '2.0.0',
      root,
      loadConfig: async () => projectConfig(),
      signal: shutdown.signal,
      ...overrides,
    },
    openRpc,
  })
  void done.catch(() => {})
  cleanups.push(async () => {
    shutdown.abort()
    await done.catch(() => {})
  })

  return { sockets, shutdown, done }
}

// Starts the loop and finishes the handshake the way Studio does.
async function connectStudio({ connectInfo = info, ...overrides }: Partial<ConnectAgentOptions> & { connectInfo?: AgentConnectInfo } = {}) {
  const started = startAgent(overrides)
  await vi.waitFor(() => expect(started.sockets).toHaveLength(1))
  const socket = started.sockets[0]!
  await socket.agent.connect(connectInfo)

  return { ...started, socket, agent: socket.agent }
}

function withHooks(): { hooks: Hookable<KubbHooks>; heard: (name: keyof KubbHooks & string) => ReturnType<typeof vi.fn> } {
  const hooks = new Hookable<KubbHooks>()
  return {
    hooks,
    heard: (name) => {
      const listener = vi.fn()
      hooks.hook(name, listener)
      return listener
    },
  }
}

async function run({ agent, jobId }: { agent: AgentApi; jobId: string }) {
  return agent.startGeneration({ jobId, config: {} }).result()
}

describe('connectAgent', () => {
  it('opens the agent socket with the bearer token and instance id, and rejects once Studio closes it with 4001', async () => {
    const seen: Array<{ url?: string; headers: IncomingHttpHeaders }> = []
    const server = createServer()
    // Accepts the upgrade, then closes with 4001 the way Studio refuses a token.
    server.on('upgrade', (req, socket) => {
      seen.push({ url: req.url, headers: req.headers })
      const accept = createHash('sha1').update(`${req.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64')
      socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
      socket.end(Buffer.from([0x88, 0x02, 0x0f, 0xa1]))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo

    try {
      await expect(
        connectAgent({
          token: 'good',
          studioUrl: `http://127.0.0.1:${port}`,
          configPath: 'kubb.config.ts',
          version: '2.0.0',
          root,
          loadConfig: async () => projectConfig(),
        }),
      ).rejects.toBeInstanceOf(InvalidAgentTokenError)
      expect(seen).toStrictEqual([
        { url: '/api/agent/socket', headers: expect.objectContaining({ authorization: 'Bearer good', [AGENT_INSTANCE_HEADER]: expect.any(String) }) },
      ])
    } finally {
      server.close()
    }
  })
})

describe('the handshake', () => {
  it('returns the root, the versions and every permission off when the host granted none', async () => {
    const { agent } = await connectStudio()

    await expect(agent.connect(info)).resolves.toMatchObject({
      root,
      versions: { kubb: '5.0.0-test', agent: '2.0.0' },
      permissions: { allowWrite: false, allowExec: false, allowConfigEdit: false, allowRead: false },
    })
  })

  it('announces the connection once per socket, with what Studio sent', async () => {
    const { hooks, heard } = withHooks()
    const connected = heard('studio:connected')
    const { agent } = await connectStudio({ hooks })
    await agent.connect(info)

    await vi.waitFor(() =>
      expect(connected).toHaveBeenCalledExactlyOnceWith({
        ...info,
        url: studioUrl,
        versions: { studio: '1.0.0', kubb: '5.0.0-test', agent: '2.0.0' },
      }),
    )
  })

  it('refuses a command Studio sends before connect()', async () => {
    const { sockets } = startAgent({ permissions: { allowRead: true } })
    await vi.waitFor(() => expect(sockets).toHaveLength(1))

    await expect(sockets[0]!.agent.readFiles({ jobId: 'job-1', paths: [] })).rejects.toThrow('Studio must call connect() before any other command')
  })

  it('refuses a plaintext Studio URL before opening a socket', async () => {
    const { sockets, done } = startAgent({ studioUrl: 'http://studio.test' })

    await expect(done).rejects.toThrow('Refusing to reach Kubb Studio')
    expect(sockets).toHaveLength(0)
  })
})

describe('plugin options in the handshake', () => {
  it('sends a JSON copy, so no function in the user config reaches Studio', async () => {
    const config = projectConfig()
    const name = (group: string) => `${group}Service`
    config.plugins[0]!.options = { output: { path: 'types' }, group: { type: 'tag', name } }
    const { agent } = await connectStudio({ loadConfig: async () => config })

    const payload = await agent.connect(info)

    expect(payload.config.plugins).toStrictEqual([{ name: '@kubb/plugin-barrel', options: { output: { path: 'types' }, group: { type: 'tag' } } }])
  })
})

describe('close codes', () => {
  it('rejects with InvalidAgentTokenError when Studio refuses the token', async () => {
    const { socket, done } = await connectStudio()
    socket.close(AgentCloseCode.UNAUTHORIZED)

    await expect(done).rejects.toBeInstanceOf(InvalidAgentTokenError)
  })

  it('rejects with IncompatibleAgentError when the agent is too old', async () => {
    const { socket, done } = await connectStudio()
    socket.close(AgentCloseCode.INCOMPATIBLE, 'needs 6.0.0')

    await expect(done).rejects.toThrow(new IncompatibleAgentError({ studioUrl, detail: 'needs 6.0.0' }))
  })

  it('stops quietly when another process took over', async () => {
    const { socket, done, sockets } = await connectStudio()
    socket.close(AgentCloseCode.SUPERSEDED)

    await expect(done).resolves.toBeUndefined()
    expect(sockets).toHaveLength(1)
  })

  it.each([1006, 1011])('reconnects after close code %s', async (code) => {
    const { hooks, heard } = withHooks()
    const disconnected = heard('studio:disconnected')
    const reconnecting = heard('studio:reconnecting')
    const { socket, sockets } = await connectStudio({ hooks })
    socket.close(code, 'gone')

    await vi.waitFor(() => expect(sockets).toHaveLength(2))
    expect(disconnected).toHaveBeenCalledWith({ code, reason: 'gone' })
    expect(reconnecting).toHaveBeenCalledOnce()
  })

  it('keeps backing off while sockets close before the handshake, and resets once Studio connects', async () => {
    using _ = vi.spyOn(Math, 'random').mockReturnValue(1)
    const { hooks, heard } = withHooks()
    const reconnecting = heard('studio:reconnecting')
    const { sockets } = startAgent({ hooks, maxRetryDelay: 60_000 })

    await vi.waitFor(() => expect(sockets).toHaveLength(1))
    sockets[0]!.close(1011)
    await vi.waitFor(() => expect(sockets).toHaveLength(2))
    sockets[1]!.close(1011)
    await vi.waitFor(() => expect(sockets).toHaveLength(3))
    await sockets[2]!.agent.connect(info)
    sockets[2]!.close(1006)
    await vi.waitFor(() => expect(sockets).toHaveLength(4))

    expect(reconnecting.mock.calls.map(([{ delayMs }]) => delayMs)).toStrictEqual([1_000, 2_000, 1_000])
  })

  it('closes the socket and resolves on shutdown, without a disconnect report', async () => {
    const { hooks, heard } = withHooks()
    const disconnected = heard('studio:disconnected')
    const { shutdown, done } = await connectStudio({ hooks })
    shutdown.abort()

    await expect(done).resolves.toBeUndefined()
    expect(disconnected).not.toHaveBeenCalled()
  })
})

describe('heartbeat', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('closes the socket once a ping goes unanswered past the timeout, then reconnects', async () => {
    vi.useFakeTimers()
    const { socket, sockets } = await connectStudio({ heartbeatInterval: 1_000 })
    socket.ping.mockReturnValue(new Promise(() => {}))

    await vi.advanceTimersByTimeAsync(1_000 + 9_999)
    expect(socket.ping).toHaveBeenCalledOnce()
    expect(sockets).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1)
    await vi.waitFor(() => expect(sockets).toHaveLength(2))
  })
})

describe('a sandbox job', () => {
  it('runs under its own temporary root, removed with its manifest cache once the job ends', async () => {
    const { agent } = await connectStudio({ connectInfo: { sandbox: true, agentSlug: 'sandbox', studioVersion: '1.0.0' } })

    await agent.startGeneration({ jobId: 'job-1', config: { input: 'openapi: 3.1.0' } }).result()

    const jobRoot = await vi.mocked(mkdtemp).mock.results[0]?.value
    expect(jobRoot).toContain(join(tmpdir(), 'kubb-job-'))
    expect(vi.mocked(rm)).toHaveBeenCalledWith(jobRoot, { recursive: true, force: true })
    expect(vi.mocked(rm)).toHaveBeenCalledWith(resolveCacheDir(jobRoot), { recursive: true, force: true })
  })

  it.each([
    ['a file path', '/etc/passwd'],
    ['a relative path', '../../petStore.yaml'],
    ['a URL', 'http://127.0.0.1:8080/internal'],
    ['an empty string', ''],
    ['no spec at all', undefined],
  ])('refuses %s instead of reading or fetching it', async (_label, input) => {
    const { hooks, heard } = withHooks()
    const warn = heard('studio:warn')
    const { agent } = await connectStudio({ hooks, connectInfo: { sandbox: true, agentSlug: 'sandbox', studioVersion: '1.0.0' } })

    await expect(agent.startGeneration({ jobId: 'job-1', config: { input } }).result()).rejects.toThrow(
      'A sandbox agent generates only from the OpenAPI document content Studio sends, not from a file path or URL',
    )
    expect(warn).toHaveBeenCalledOnce()
    expect(vi.mocked(mkdtemp).mock.results).toHaveLength(1)
  })

  it('reports writes and config edits off and reads on, whatever the host granted', async () => {
    const { agent } = await connectStudio({ permissions: { allowWrite: true, allowConfigEdit: true }, connectInfo: { ...info, sandbox: true } })

    await expect(agent.connect({ ...info, sandbox: true })).resolves.toMatchObject({
      permissions: { allowWrite: false, allowConfigEdit: false, allowRead: true },
    })
  })
})

describe('generation reports', () => {
  async function events(run: ReturnType<AgentApi['startGeneration']>) {
    const seen: Array<{ type: string; data: unknown }> = []
    const reader = (await run.events()).getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return seen
      seen.push({ type: value.type, data: value.data })
    }
  }

  it('tells Studio, through the event stream, that a project agent ignored its spec', async () => {
    const { agent } = await connectStudio()

    const run = agent.startGeneration({ jobId: 'job-1', config: { input: 'openapi: 3.1.0' } })
    const [seen] = await Promise.all([events(run), run.result()])

    expect(seen).toContainEqual({
      type: 'kubb:warn',
      data: [{ message: 'Ignored the spec from Studio: generating from a Studio spec is only available to a sandbox agent', info: undefined }],
    })
  })

  it('reports a plugin Studio asked for that cannot be loaded to the host as well', async () => {
    const { hooks, heard } = withHooks()
    const error = heard('kubb:error')
    const { agent } = await connectStudio({ hooks })

    await expect(agent.startGeneration({ jobId: 'job-1', config: { plugins: [{ name: 'not-a-plugin' }] } }).result()).rejects.toThrow(
      'is not a @kubb/plugin-* package',
    )
    expect(error).toHaveBeenCalledWith({ error: expect.objectContaining({ message: expect.stringContaining('is not a @kubb/plugin-* package') }) })
  })
})

describe('readFiles', () => {
  it('refuses to read when the host did not grant allowRead, and names the permission for the host', async () => {
    const { hooks, heard } = withHooks()
    const warn = heard('studio:warn')
    const { agent } = await connectStudio({ hooks })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).rejects.toThrow('The agent was not granted permission to read generated files')
    expect(warn).toHaveBeenCalledWith({ message: expect.stringContaining('not granted'), permission: 'allowRead' })
  })

  it('returns only the paths the run produced, paged with their line count, so a request cannot escape the output', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await run({ agent, jobId: 'job-1' })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['../../etc/passwd', 'src/gen/pet.ts'], limit: 10 })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1' },
      pages: { 'src/gen/pet.ts': { nextCursor: null, totalLines: 1 } },
    })
  })

  it.each([{ cursor: -1, limit: 10 }, { cursor: 0.5, limit: 10 }, { cursor: 0, limit: 0 }, { cursor: 0, limit: MAX_PAGE_LINES + 1 }, { cursor: 5 }])(
    'refuses the page %j',
    async (page) => {
      const { agent } = await connectStudio({ permissions: { allowRead: true } })
      await run({ agent, jobId: 'job-1' })

      await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'], ...page })).rejects.toThrow('The cursor must be')
    },
  )
})

describe('generation history', () => {
  it('fingerprints every file in the run result, run on the project root', async () => {
    const { hooks, heard } = withHooks()
    const command = heard('studio:command')
    const { agent } = await connectStudio({ hooks, permissions: { allowRead: true } })

    const result = await run({ agent, jobId: 'job-1' })

    expect(result.hashes).toStrictEqual({ 'src/gen/pet.ts': expect.stringMatching(/^[0-9a-f]{16}$/) })
    expect(vi.mocked(mkdtemp)).not.toHaveBeenCalled()
    expect(command).toHaveBeenCalledWith({ command: 'generate', info: '1 plugin, in memory' })
  })

  it('reads every earlier job after the agent restarts, from the project cache', async () => {
    const content = { current: '' }
    const loadConfig = async () => projectConfig({ content: content.current })
    const first = await connectStudio({ permissions: { allowRead: true }, loadConfig })
    content.current = 'export const pet = 1'
    await run({ agent: first.agent, jobId: 'job-1' })
    content.current = 'export const pet = 2'
    await run({ agent: first.agent, jobId: 'job-2' })

    const { agent } = await connectStudio({ permissions: { allowRead: true } })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 1' } })
    await expect(agent.readFiles({ jobId: 'job-2', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({ files: { 'src/gen/pet.ts': 'export const pet = 2' } })
  })
})

describe('disk snapshot', () => {
  async function seedDisk(files: Record<string, string>) {
    const storage = fsStorage()
    for (const [path, value] of Object.entries(files)) await storage.writeItem(`${root}/${path}`, value)
  }

  it('fingerprints what the output directory held before the run', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'on disk', 'src/gen/old.ts': 'stale', 'src/other.ts': 'not output' })
    const { agent } = await connectStudio({ permissions: { allowRead: true } })

    const result = await run({ agent, jobId: 'job-1' })

    expect(Object.keys(result.disk?.hashes ?? {}).toSorted()).toStrictEqual(['src/gen/old.ts', 'src/gen/pet.ts'])
    expect(result.disk?.hashes['src/gen/pet.ts']).not.toBe(result.hashes['src/gen/pet.ts'])
  })

  it('reads a job against the disk it ran over', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'on disk' })
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await run({ agent, jobId: 'job-1' })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts', 'src/other.ts'], source: 'disk' })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'on disk' },
    })
  })
})

describe('saveConfig', () => {
  it('refuses every edit when the host did not grant allowConfigEdit', async () => {
    const { agent } = await connectStudio()
    const edits = [{ operation: 'remove', plugin: '@kubb/plugin-ts', path: ['enumType'] }] satisfies Parameters<AgentApi['saveConfig']>[0]['edits']

    await expect(agent.saveConfig({ edits })).resolves.toStrictEqual({
      outcomes: [{ edit: edits[0], applied: false, reason: 'the agent was not granted permission to edit kubb.config.ts' }],
      changed: false,
    })
  })
})

describe('disconnect during generation', () => {
  it('waits for the canceled run before opening the next socket', async () => {
    const loaded = Promise.withResolvers<Config>()
    const loadConfig = vi
      .fn()
      .mockResolvedValueOnce(projectConfig())
      .mockImplementationOnce(() => loaded.promise)
      .mockResolvedValue(projectConfig())
    const { agent, socket, sockets } = await connectStudio({ loadConfig })
    const generation = run({ agent, jobId: 'interrupted' }).catch(() => {})
    await vi.waitFor(() => expect(loadConfig).toHaveBeenCalledTimes(2))
    await expect(run({ agent, jobId: 'duplicate' })).rejects.toThrow('already in progress')

    socket.close(1006)
    await Promise.resolve()
    expect(sockets).toHaveLength(1)
    loaded.resolve(projectConfig())
    await generation

    await vi.waitFor(() => expect(sockets).toHaveLength(2))
    await expect(run({ agent, jobId: 'late' })).rejects.toThrow('Connection is closed')
  })

  it('tells the host why the running generation stopped', async () => {
    const { hooks, heard } = withHooks()
    const warn = heard('studio:warn')
    const loaded = Promise.withResolvers<Config>()
    const loadConfig = vi
      .fn()
      .mockResolvedValueOnce(projectConfig())
      .mockImplementationOnce(() => loaded.promise)
      .mockResolvedValue(projectConfig())
    const { agent, socket } = await connectStudio({ hooks, loadConfig })
    const generation = run({ agent, jobId: 'interrupted' }).catch(() => {})
    await vi.waitFor(() => expect(loadConfig).toHaveBeenCalledTimes(2))

    socket.close(1011)
    loaded.resolve(projectConfig())
    await generation

    await vi.waitFor(() => expect(warn).toHaveBeenCalledWith({ message: 'Canceled the running generation: the connection to Kubb Studio closed' }))
  })

  it('cancels the run before a slow listener has heard why', async () => {
    const hooks = new Hookable<KubbHooks>()
    const heard = Promise.withResolvers<void>()
    hooks.hook('studio:warn', () => heard.promise)
    const loaded = Promise.withResolvers<Config>()
    const loadConfig = vi
      .fn()
      .mockResolvedValueOnce(projectConfig())
      .mockImplementationOnce(() => loaded.promise)
      .mockResolvedValue(projectConfig())
    const { agent, socket } = await connectStudio({ hooks, loadConfig })
    const generation = run({ agent, jobId: 'interrupted' })
    await vi.waitFor(() => expect(loadConfig).toHaveBeenCalledTimes(2))

    socket.close(1011)
    loaded.resolve(projectConfig())

    await expect(generation).rejects.toThrow('Generation canceled')
    heard.resolve()
  })
})
