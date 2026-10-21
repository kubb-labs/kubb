import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer, type IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ast } from '@kubb/ast'
import { type Config, defineExtension, fsStorage, Hookable, type KubbHooks, resolveCacheDir, type Storage } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ConnectAgentOptions, connectAgent, IncompatibleAgentError, InvalidAgentTokenError, type OpenRpc, runAgent } from './connect.ts'
import { AGENT_INSTANCE_HEADER, type AgentApi, AgentCloseCode, AgentMessage, type AgentConnectInfo, type ConfigRef, MAX_PAGE_LINES } from './protocol.ts'
import { projectConfig, root } from './testing.ts'

vi.mock('../package.json', () => ({ version: '5.0.0-test' }))

// Reconnects wait for nothing, so a test sees the next socket straight away.
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(async () => {}) }))

// Studio may add a plugin of its own, which the agent imports by package name.
vi.mock('@kubb/plugin-ts', () => ({ pluginTs: (options: unknown) => ({ name: 'plugin-ts', options }) }))

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
      loadConfigs: async () => [projectConfig()],
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

async function run({ agent, jobId, requestedBy }: { agent: AgentApi; jobId: string; requestedBy?: string }) {
  return agent.startGeneration({ jobId, config: {}, requestedBy }).result()
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
          loadConfigs: async () => [projectConfig()],
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

  it('reports the installed extensions, and a plugin by the package its manifest is in', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'kubb-agent-extensions-'))
    cleanups.push(() => rm(projectRoot, { recursive: true, force: true }))
    const manifest = { kind: 'plugin', name: 'plugin-x', export: 'pluginX', displayName: 'X', description: 'Generates X.' }
    const packageDir = join(projectRoot, 'node_modules/@acme/plugin-x')
    await mkdir(packageDir, { recursive: true })
    await writeFile(join(projectRoot, 'package.json'), JSON.stringify({ devDependencies: { '@acme/plugin-x': '^1.0.0' } }))
    await writeFile(join(packageDir, 'package.json'), JSON.stringify({ name: '@acme/plugin-x', version: '1.2.3' }))
    await writeFile(join(packageDir, 'kubb-extension.json'), JSON.stringify(manifest))
    const plugin = defineExtension({ kind: 'plugin', meta: { name: 'plugin-x' }, hooks: {} })()
    const { agent } = await connectStudio({ root: projectRoot, loadConfigs: async () => [{ ...projectConfig({ projectRoot }), plugins: [plugin] }] })

    const { config } = await agent.connect(info)

    expect(config.configs[0]!.plugins).toStrictEqual([{ name: '@acme/plugin-x', options: {} }])
    // `pnpm test` puts the workspace on NODE_PATH, so Kubb's own extensions may resolve here too.
    expect(config.extensions).toContainEqual({ package: '@acme/plugin-x', version: '1.2.3', manifest })
  })

  it('reports the adapter and the parsers by the package their manifest is in, with a JSON copy of their options', async () => {
    const parser = defineExtension({
      kind: 'parser',
      meta: { name: 'typescript' },
      build: () => ({ extNames: ['.ts'], parse: () => '', print: () => '' }),
    })({ indent: 2, format: () => '' })
    const { agent } = await connectStudio({ loadConfigs: async () => [{ ...projectConfig(), parsers: [parser] }] })

    const { config } = await agent.connect(info)

    expect(config.configs[0]!.adapter).toStrictEqual({ name: '@kubb/adapter-oas', options: {} })
    expect(config.configs[0]!.parsers).toStrictEqual([{ name: '@kubb/parser-ts', options: { indent: 2 } }])
  })

  it('reports every entry of a config array, with the credentials left out of a URL input', async () => {
    const pets = { ...projectConfig(), input: 'https://alice:secret@example.com/openapi.json?v=2' }
    const admin = { ...projectConfig(), name: 'admin', input: './admin.yaml', output: { path: 'src/admin' } }
    const { agent } = await connectStudio({ loadConfigs: async () => [pets, admin] })

    const { config } = await agent.connect(info)

    const plugins = [{ name: '@kubb/plugin-barrel', options: {} }]
    const adapter = { name: '@kubb/adapter-oas', options: {} }
    expect(config.configs).toStrictEqual([
      { input: 'https://example.com/openapi.json?v=2', output: 'src/gen', plugins, adapter, parsers: [] },
      { name: 'admin', input: './admin.yaml', output: 'src/admin', plugins, adapter, parsers: [] },
    ])
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
})

describe('close codes', () => {
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

  it('reconnects after an abnormal close', async () => {
    const { hooks, heard } = withHooks()
    const disconnected = heard('studio:disconnected')
    const reconnecting = heard('studio:reconnecting')
    const { socket, sockets } = await connectStudio({ hooks })
    socket.close(1006, 'gone')

    await vi.waitFor(() => expect(sockets).toHaveLength(2))
    expect(disconnected).toHaveBeenCalledWith({ code: 1006, reason: 'gone' })
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

  it('refuses a file path instead of reading it', async () => {
    const { hooks, heard } = withHooks()
    const warn = heard('studio:warn')
    const { agent } = await connectStudio({ hooks, connectInfo: { sandbox: true, agentSlug: 'sandbox', studioVersion: '1.0.0' } })

    await expect(agent.startGeneration({ jobId: 'job-1', config: { input: '/etc/passwd' } }).result()).rejects.toThrow(AgentMessage.SANDBOX_INPUT_ONLY)
    expect(warn).toHaveBeenCalledOnce()
    expect(vi.mocked(mkdtemp).mock.results).toHaveLength(1)
  })

  it('refuses a file path from Studio on a managed agent, which has no business reading its disk', async () => {
    const { agent } = await connectStudio({ connectInfo: { ...info, managed: true } })

    await expect(agent.startGeneration({ jobId: 'job-1', config: { input: '/etc/passwd' } }).result()).rejects.toThrow(AgentMessage.MANAGED_INPUT_KIND)
  })

  it('generates a managed agent from the spec Studio sends instead of warning that it is ignored', async () => {
    const { hooks, heard } = withHooks()
    const warn = heard('kubb:warn')
    const { agent } = await connectStudio({ hooks, connectInfo: { ...info, managed: true } })

    await agent.startGeneration({ jobId: 'job-1', config: { input: 'openapi: 3.1.0' } }).result()
    expect(warn).not.toHaveBeenCalled()
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
      'is not an installed Kubb plugin',
    )
    expect(error).toHaveBeenCalledWith({ error: expect.objectContaining({ message: expect.stringContaining('is not an installed Kubb plugin') }) })
  })

  it('refuses an output path from Studio outside the output folder before anything is written', async () => {
    const { hooks, heard } = withHooks()
    const error = heard('kubb:error')
    const { agent } = await connectStudio({ hooks, permissions: { allowWrite: true } })
    const output = { path: '../../../home/alice/.ssh/authorized_keys' }

    await expect(agent.startGeneration({ jobId: 'job-1', config: { plugins: [{ name: '@kubb/plugin-ts', options: { output } }] } }).result()).rejects.toThrow(
      'Plugin "plugin-ts" would write to "/home/alice/.ssh/authorized_keys", outside the output folder',
    )
    expect(error).toHaveBeenCalledOnce()
    expect(disk.storage).toBeUndefined()
  })
})

describe('a config array', () => {
  const configs = () => [projectConfig(), { ...projectConfig({ content: 'export const admin = 1' }), name: 'admin' }]

  it('generates from the entry Studio names, by position or by name, and the first one otherwise', async () => {
    const { agent } = await connectStudio({ loadConfigs: async () => configs(), permissions: { allowRead: true } })
    const content = async (jobId: string, config?: ConfigRef) => {
      await agent.startGeneration({ jobId, config: { config } }).result()
      return (await agent.readFiles({ jobId, paths: ['src/gen/pet.ts'], limit: 10 })).files['src/gen/pet.ts']
    }

    await expect(content('job-1')).resolves.toBe('export const pet = 1')
    await expect(content('job-2', 1)).resolves.toBe('export const admin = 1')
    await expect(content('job-3', 'admin')).resolves.toBe('export const admin = 1')
  })

  it('refuses an entry the file does not have', async () => {
    const { agent } = await connectStudio({ loadConfigs: async () => configs() })

    await expect(agent.startGeneration({ jobId: 'job-1', config: { config: 'billing' } }).result()).rejects.toThrow(AgentMessage.CONFIG_ENTRY_NOT_FOUND)
    expect(disk.storage).toBeUndefined()
  })
})

describe('readFiles', () => {
  it('refuses to read when the host did not grant allowRead, and names the permission for the host', async () => {
    const { hooks, heard } = withHooks()
    const warn = heard('studio:warn')
    const { agent } = await connectStudio({ hooks })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).rejects.toThrow(AgentMessage.READ_NOT_ALLOWED)
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

  it('refuses a page longer than the maximum', async () => {
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    await run({ agent, jobId: 'job-1' })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'], cursor: 0, limit: MAX_PAGE_LINES + 1 })).rejects.toThrow(
      AgentMessage.INVALID_PAGE,
    )
  })
})

describe('readDiff', () => {
  async function twoRuns(permissions = { allowRead: true }) {
    const content = { current: 'export const pet = 1' }
    const { agent } = await connectStudio({ permissions, loadConfigs: async () => [projectConfig({ content: content.current })] })
    await run({ agent, jobId: 'job-1' })
    content.current = 'export const pet = 2'
    await run({ agent, jobId: 'job-2' })
    return agent
  }
  const base = { jobId: 'job-1' } as const

  it('refuses without allowRead', async () => {
    const agent = await twoRuns({ allowRead: false })
    await expect(agent.readDiff({ jobId: 'job-2', path: 'src/gen/pet.ts', base, limit: 10 })).rejects.toThrow(AgentMessage.READ_NOT_ALLOWED)
  })

  it('returns the changed lines of a file between two jobs', async () => {
    const agent = await twoRuns()
    await expect(agent.readDiff({ jobId: 'job-2', path: 'src/gen/pet.ts', base, limit: 10 })).resolves.toStrictEqual({
      hunks: [
        {
          index: 0,
          oldStart: 1,
          oldLines: 1,
          newStart: 1,
          newLines: 1,
          lines: ['-export const pet = 1', '\\ No newline at end of file', '+export const pet = 2', '\\ No newline at end of file'],
        },
      ],
      nextCursor: null,
      hasBase: true,
      stats: { additions: 1, deletions: 1, hunks: 1, lines: 4, coarse: false },
    })
  })

  it('reports a path the base does not hold, and never reads outside the sets', async () => {
    const agent = await twoRuns()
    await expect(agent.readDiff({ jobId: 'job-2', path: '../../etc/passwd', base, limit: 10 })).resolves.toStrictEqual({
      hunks: [],
      nextCursor: null,
      hasBase: false,
      stats: { additions: 0, deletions: 0, hunks: 0, lines: 0, coarse: false },
    })
  })

  it('refuses a job the agent no longer keeps', async () => {
    const agent = await twoRuns()
    await expect(agent.readDiff({ jobId: 'job-2', path: 'src/gen/pet.ts', base: { jobId: 'job-gone' }, limit: 10 })).rejects.toThrow(
      AgentMessage.GENERATION_GONE,
    )
  })
})

describe('readInput', () => {
  const input = ast.factory.createInput({
    operations: [ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })],
    meta: { title: 'Pet store', circularNames: [], enumNames: [] },
  })
  /** A project config whose adapter parses to `input`. */
  const withInput = async () => [{ ...projectConfig(), adapter: createMockedAdapter({ parse: async () => input }) }]

  it('refuses to read when the host did not grant allowReadAst, and names the permission for the host', async () => {
    const { hooks, heard } = withHooks()
    const warn = heard('studio:warn')
    const { agent } = await connectStudio({ hooks })

    await expect(agent.readInput({ jobId: 'job-1' })).rejects.toThrow(AgentMessage.READ_AST_NOT_ALLOWED)
    expect(warn).toHaveBeenCalledWith({ message: expect.stringContaining('not granted'), permission: 'allowReadAst' })
  })

  it('returns the AST the job parsed, also after the agent restarts, and refuses a job it does not keep', async () => {
    const first = await connectStudio({ permissions: { allowReadAst: true }, loadConfigs: withInput })
    await run({ agent: first.agent, jobId: 'job-1' })

    const { agent } = await connectStudio({ permissions: { allowReadAst: true } })

    await expect(agent.readInput({ jobId: 'job-1' })).resolves.toStrictEqual({ input: JSON.parse(JSON.stringify(input)) })
    await expect(agent.readInput({ jobId: 'job-unknown' })).rejects.toThrow(AgentMessage.GENERATION_GONE)
  })

  it('keeps no input for a run without allowReadAstAst, so a later grant finds none, not even an earlier run of the job', async () => {
    const first = await connectStudio({ permissions: { allowReadAst: true }, loadConfigs: withInput })
    await run({ agent: first.agent, jobId: 'job-1' })
    const rerun = await connectStudio({ loadConfigs: withInput })
    await run({ agent: rerun.agent, jobId: 'job-1' })

    const { agent } = await connectStudio({ permissions: { allowReadAst: true } })

    await expect(agent.readInput({ jobId: 'job-1' })).rejects.toThrow(AgentMessage.NO_INPUT)
  })
})

describe('generation history', () => {
  it('fingerprints every file in the run result, run on the project root', async () => {
    const { hooks, heard } = withHooks()
    const command = heard('studio:command')
    const { agent } = await connectStudio({ hooks, permissions: { allowRead: true } })

    const result = await run({ agent, jobId: 'job-1', requestedBy: 'Stijn' })

    expect(result.hashes).toStrictEqual({ 'src/gen/pet.ts': expect.stringMatching(/^[0-9a-f]{16}$/) })
    expect(vi.mocked(mkdtemp)).toHaveBeenCalledWith(expect.stringContaining('kubb-output-'))
    expect(command).toHaveBeenCalledWith({ command: 'generate', info: '1 plugin, staged on disk', requestedBy: 'Stijn' })
  })

  it('reads every earlier job after the agent restarts, from the project cache', async () => {
    const content = { current: '' }
    const loadConfigs = async () => [projectConfig({ content: content.current })]
    const first = await connectStudio({ permissions: { allowRead: true }, loadConfigs })
    content.current = 'export const pet = 1'
    await run({ agent: first.agent, jobId: 'job-1' })
    content.current = 'export const pet = 2'
    await run({ agent: first.agent, jobId: 'job-2' })

    const { agent } = await connectStudio({ permissions: { allowRead: true } })

    await expect(agent.readFiles({ jobId: 'job-1', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 1' },
    })
    await expect(agent.readFiles({ jobId: 'job-2', paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'export const pet = 2' },
    })
  })
})

describe('current disk output', () => {
  async function seedDisk(files: Record<string, string>) {
    const storage = fsStorage()
    for (const [path, value] of Object.entries(files)) await storage.writeItem(`${root}/${path}`, value)
  }

  it('opens the existing output without running the generator or changing the files', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'on disk\n', 'src/gen/empty.ts': '', 'src/other.ts': 'not output' })
    const { hooks, heard } = withHooks()
    const generationStarted = heard('kubb:build:start')
    const { agent } = await connectStudio({ permissions: { allowRead: true }, hooks })
    const output = (await agent.connect(info)).config.configs[0]!.disk

    expect(output?.files.toSorted()).toStrictEqual(['src/gen/empty.ts', 'src/gen/pet.ts'])
    await expect(agent.readFiles({ jobId: output!.jobId, paths: ['src/gen/pet.ts', 'src/gen/empty.ts', 'src/other.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'on disk\n', 'src/gen/empty.ts': '' },
    })
    expect(generationStarted).not.toHaveBeenCalled()
    await expect(fsStorage().readItem(`${root}/src/gen/pet.ts`)).resolves.toBe('on disk\n')
  })

  it('keeps the initial output immutable after local edits', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'first' })
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    const output = (await agent.connect(info)).config.configs[0]!.disk
    await seedDisk({ 'src/gen/pet.ts': 'second' })
    await expect(agent.readFiles({ jobId: output!.jobId, paths: ['src/gen/pet.ts'] })).resolves.toStrictEqual({
      files: { 'src/gen/pet.ts': 'first' },
    })
  })

  it('omits the disk output without read permission', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'private' })
    const { agent } = await connectStudio()

    expect((await agent.connect(info)).config.configs[0]!.disk).toBeUndefined()
  })

  it('omits the disk output for a sandbox even when it allows reads', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'private' })
    const connectInfo = { ...info, sandbox: true }
    const { agent } = await connectStudio({ connectInfo, permissions: { allowRead: true } })

    expect((await agent.connect(connectInfo)).config.configs[0]!.disk).toBeUndefined()
  })

  it('does not list the project when the output path is the root', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'private' })
    const { agent } = await connectStudio({
      permissions: { allowRead: true },
      loadConfigs: async () => [{ ...projectConfig(), output: { path: '.' } }],
    })

    expect((await agent.connect(info)).config.configs[0]!.disk).toBeUndefined()
  })

  it('compares a generated output with the initial disk snapshot', async () => {
    await seedDisk({ 'src/gen/pet.ts': 'old disk content' })
    const { agent } = await connectStudio({ permissions: { allowRead: true } })
    const output = (await agent.connect(info)).config.configs[0]!.disk
    await run({ agent, jobId: 'job-1' })
    const diff = await agent.readDiff({ jobId: 'job-1', path: 'src/gen/pet.ts', base: { jobId: output!.jobId }, limit: 100 })
    expect(diff.hunks.flatMap((hunk) => hunk.lines)).toContain('-old disk content')
    expect(output?.hashes['src/gen/pet.ts']).toMatch(/^[0-9a-f]{16}$/)
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
    const loaded = Promise.withResolvers<Array<Config>>()
    const loadConfigs = vi
      .fn()
      .mockResolvedValueOnce([projectConfig()])
      .mockImplementationOnce(() => loaded.promise)
      .mockResolvedValue([projectConfig()])
    const { agent, socket, sockets } = await connectStudio({ loadConfigs })
    const generation = run({ agent, jobId: 'interrupted' }).catch(() => {})
    await vi.waitFor(() => expect(loadConfigs).toHaveBeenCalledTimes(2))
    await expect(run({ agent, jobId: 'duplicate' })).rejects.toThrow('already in progress')

    socket.close(1006)
    await Promise.resolve()
    expect(sockets).toHaveLength(1)
    loaded.resolve([projectConfig()])
    await generation

    await vi.waitFor(() => expect(sockets).toHaveLength(2))
    await expect(run({ agent, jobId: 'late' })).rejects.toThrow('Connection is closed')
  })

  it('cancels the run before a slow listener has heard why, and tells the host why it stopped', async () => {
    const hooks = new Hookable<KubbHooks>()
    const heard = Promise.withResolvers<void>()
    const warn = vi.fn(() => heard.promise)
    hooks.hook('studio:warn', warn)
    const loaded = Promise.withResolvers<Array<Config>>()
    const loadConfigs = vi
      .fn()
      .mockResolvedValueOnce([projectConfig()])
      .mockImplementationOnce(() => loaded.promise)
      .mockResolvedValue([projectConfig()])
    const { agent, socket } = await connectStudio({ hooks, loadConfigs })
    const generation = run({ agent, jobId: 'interrupted' })
    await vi.waitFor(() => expect(loadConfigs).toHaveBeenCalledTimes(2))

    socket.close(1011)
    loaded.resolve([projectConfig()])

    await expect(generation).rejects.toThrow('Generation canceled')
    expect(warn).toHaveBeenCalledWith({ message: 'Canceled the running generation: the connection to Kubb Studio closed' })
    heard.resolve()
  })
})
