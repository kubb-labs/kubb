import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer, type IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ast } from '@kubb/ast'
import { type Config, defineExtension, fsStorage, Hookable, type KubbHooks, resolveCacheDir, type Storage } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { read } from '@internals/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ConnectAgentOptions, connectAgent, IncompatibleAgentError, InvalidAgentTokenError, type OpenRpc, runAgent } from './connect.ts'
import { toInputJson } from './generations.ts'
import {
  AGENT_INSTANCE_HEADER,
  type AgentApi,
  AgentCloseCode,
  AgentMessage,
  type AgentConnectInfo,
  type ConfigEdit,
  ConfigEditOperation,
  type ConfigRef,
  MAX_PAGE_LINES,
} from './protocol.ts'
import { projectConfig, root } from './testing.ts'

vi.mock('../package.json', () => ({ version: '5.0.0-test' }))

// Reconnects wait for nothing, so a test sees the next socket straight away.
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(async () => {}) }))

// `kubb add` is the CLI's own command; the test checks what the agent runs it with.
const x = vi.hoisted(() => vi.fn())
vi.mock('tinyexec', () => ({ x }))

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
      permissions: { allowWrite: false, allowExec: false, allowConfigEdit: false, allowInstall: false, allowRead: false },
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
    const parserManifest = { kind: 'parser', name: 'parser-md', export: 'parserMd', displayName: 'Markdown', description: 'Prints Markdown.' }
    const parserDir = join(projectRoot, 'node_modules/@kubb/parser-md')
    await mkdir(parserDir, { recursive: true })
    await writeFile(join(parserDir, 'package.json'), JSON.stringify({ name: '@kubb/parser-md', version: '9.9.9' }))
    await writeFile(join(parserDir, 'kubb-extension.json'), JSON.stringify(parserManifest))
    const plugin = defineExtension({ kind: 'plugin', meta: { name: 'plugin-x' }, hooks: {} })()
    const { agent } = await connectStudio({ root: projectRoot, loadConfigs: async () => [{ ...projectConfig({ projectRoot }), plugins: [plugin] }] })

    const { config } = await agent.connect(info)

    expect(config.configs[0]!.plugins).toStrictEqual([{ name: '@acme/plugin-x', options: {} }])
    // `pnpm test` puts the workspace on NODE_PATH, so Kubb's own extensions may resolve here too.
    expect(config.extensions).toContainEqual({ package: '@acme/plugin-x', version: '1.2.3', manifest })
    // A package that ships with kubb is marked, so Studio offers no `kubb update` for it.
    expect(config.extensions).toContainEqual({ package: '@kubb/parser-md', version: '9.9.9', manifest: parserManifest, bundled: true })
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
      { input: 'https://example.com/openapi.json?v=2', output: 'src/gen', outputOptions: { clean: false }, plugins, adapter, parsers: [] },
      { name: 'admin', input: './admin.yaml', output: 'src/admin', outputOptions: {}, plugins, adapter, parsers: [] },
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

  it.each([
    ['a git repository over plain http', 'git+http://93.184.216.34/api.git#main:openapi.yaml'],
    ['a git repository on a private address', 'git+https://10.0.0.5/api.git#main:openapi.yaml'],
  ])('refuses %s before it fetches anything', async (_label, input) => {
    const { agent } = await connectStudio({ connectInfo: { ...info, managed: true } })

    await expect(agent.startGeneration({ jobId: 'job-1', config: { input } }).result()).rejects.toThrow(/https repository URL|not a public address/)
  })

  it('limits the fetch of a managed agent to public addresses, and only while it generates', async () => {
    const original = globalThis.fetch
    const parse = async () => {
      // What the adapter does for a URL input, or for a `$ref` inside the document.
      await fetch('http://169.254.169.254/latest/meta-data')
      return ast.factory.createInput({ operations: [], meta: { title: 'Pets', circularNames: new Set<string>(), enumNames: new Set<string>() } })
    }
    const loadConfigs = async () => [{ ...projectConfig(), adapter: createMockedAdapter({ parse }) }]
    const { agent } = await connectStudio({ loadConfigs, connectInfo: { ...info, managed: true } })

    await expect(agent.startGeneration({ jobId: 'job-1', config: {} }).result()).rejects.toThrow('not a public address')
    expect(globalThis.fetch).toBe(original)
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
      permissions: { allowWrite: false, allowConfigEdit: false, allowInstall: false, allowRead: true },
    })
  })
})

describe('installExtension', () => {
  const granted = { allowInstall: true, allowUpdate: true, allowConfigEdit: true }
  const exec = (exitCode: number | undefined, stdout = '', stderr = '') => x.mockResolvedValueOnce({ stdout, stderr, exitCode })

  it('runs kubb add with the id and the config path, without a shell, and reports the command', async () => {
    const { hooks, heard } = withHooks()
    const command = heard('studio:command')
    const { agent } = await connectStudio({ hooks, permissions: granted, kubbBin: '/bin/kubb.js' })
    exec(0, 'added 1 package')

    await expect(agent.installExtension({ id: 'plugin-zod', requestedBy: 'Ada' })).resolves.toStrictEqual({ installed: true })
    expect(x).toHaveBeenCalledWith(
      process.execPath,
      ['/bin/kubb.js', 'add', 'plugin-zod', '--yes', '--config', join(root, 'kubb.config.ts')],
      expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: root }) }),
    )
    expect(command).toHaveBeenCalledWith(expect.objectContaining({ command: 'installExtension', info: 'installed plugin-zod', requestedBy: 'Ada' }))
  })

  it('hands back the end of the output when kubb add fails', async () => {
    const { agent } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    exec(1, 'Reading the registry\nNo extension named plugin-nope')

    await expect(agent.installExtension({ id: 'plugin-nope' })).resolves.toStrictEqual({
      installed: false,
      reason: 'Reading the registry\nNo extension named plugin-nope',
    })
  })

  it('holds off a save and a second install while kubb add runs, and ends the child when the socket closes', async () => {
    const { agent, socket } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    const started = Promise.withResolvers<AbortSignal>()
    const child = Promise.withResolvers<{ stdout: string; stderr: string; exitCode: number | undefined }>()
    x.mockImplementationOnce((_file: string, _args: Array<string>, options: { signal: AbortSignal }) => {
      started.resolve(options.signal)
      return child.promise
    })
    const install = agent.installExtension({ id: 'plugin-zod' })
    const signal = await started.promise

    const edit: ConfigEdit = { operation: ConfigEditOperation.DISABLE_PLUGIN, config: 0, plugin: '@kubb/plugin-ts' }
    await expect(agent.saveConfig({ edits: [edit] })).resolves.toMatchObject({
      outcomes: [{ applied: false, reason: 'an install, update, or remove is in progress' }],
    })
    await expect(agent.installExtension({ id: 'plugin-msw' })).resolves.toMatchObject({
      installed: false,
      reason: 'an install, update, or remove is in progress',
    })
    await expect(agent.updateExtensions({})).resolves.toMatchObject({ updated: false, reason: 'an install, update, or remove is in progress' })
    await expect(agent.startGeneration({ jobId: 'job-1', config: {} }).result()).rejects.toThrow(AgentMessage.INSTALL_IN_PROGRESS)

    socket.close(1006)
    await vi.waitFor(() => expect(signal.aborted).toBe(true))
    child.resolve({ stdout: '', stderr: '', exitCode: undefined })
    await expect(install).resolves.toStrictEqual({ installed: false, reason: 'kubb add exited with a signal' })
  })

  it('runs kubb update with the ids and --yes, and reports the command', async () => {
    const { hooks, heard } = withHooks()
    const command = heard('studio:command')
    const { agent } = await connectStudio({ hooks, permissions: granted, kubbBin: '/bin/kubb.js' })
    exec(0, 'Update complete')

    await expect(agent.updateExtensions({ ids: ['plugin-zod'], requestedBy: 'Ada' })).resolves.toStrictEqual({ updated: true })
    expect(x).toHaveBeenCalledWith(
      process.execPath,
      ['/bin/kubb.js', 'update', 'plugin-zod', '--yes'],
      expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: root }) }),
    )
    expect(command).toHaveBeenCalledWith(expect.objectContaining({ command: 'updateExtensions', info: 'updated plugin-zod', requestedBy: 'Ada' }))
  })

  it('updates every extension without ids, and hands back the output when kubb update fails', async () => {
    const { agent } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    exec(1, 'npm ERR! network')

    await expect(agent.updateExtensions({})).resolves.toStrictEqual({ updated: false, reason: 'npm ERR! network' })
    expect(x).toHaveBeenCalledWith(process.execPath, ['/bin/kubb.js', 'update', '--yes'], expect.anything())
  })

  it('refuses an update without allowUpdate or with an id that is not a registry id, and needs no other permission', async () => {
    const { agent } = await connectStudio({ permissions: { ...granted, allowUpdate: false }, kubbBin: '/bin/kubb.js' })
    await expect(agent.updateExtensions({})).resolves.toMatchObject({ updated: false, reason: 'updating extensions was not granted' })

    const { agent: updateOnly } = await connectStudio({ permissions: { allowUpdate: true }, kubbBin: '/bin/kubb.js' })
    exec(0, 'Update complete')
    await expect(updateOnly.updateExtensions({})).resolves.toStrictEqual({ updated: true })
    // A message without a body updates everything, like an empty one, instead of throwing.
    exec(0, 'Update complete')
    await expect(updateOnly.updateExtensions(null as never)).resolves.toStrictEqual({ updated: true })
    x.mockClear()

    const { agent: allowed } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    await expect(allowed.updateExtensions({ ids: ['--dry-run'] })).resolves.toMatchObject({
      updated: false,
      reason: 'the message carried an invalid registry id',
    })
    expect(x).not.toHaveBeenCalled()
  })

  it('runs kubb remove with the id and the config path, and reports the command', async () => {
    const { hooks, heard } = withHooks()
    const command = heard('studio:command')
    const { agent } = await connectStudio({ hooks, permissions: { allowRemove: true, allowConfigEdit: true }, kubbBin: '/bin/kubb.js' })
    exec(0, 'Removed plugin-zod')

    await expect(agent.removeExtension({ id: 'plugin-zod', requestedBy: 'Ada' })).resolves.toStrictEqual({ removed: true })
    expect(x).toHaveBeenCalledWith(
      process.execPath,
      ['/bin/kubb.js', 'remove', 'plugin-zod', '--yes', '--config', join(root, 'kubb.config.ts')],
      expect.objectContaining({ nodeOptions: expect.objectContaining({ cwd: root }) }),
    )
    expect(command).toHaveBeenCalledWith(expect.objectContaining({ command: 'removeExtension', info: 'removed plugin-zod', requestedBy: 'Ada' }))
  })

  it('refuses a remove without allowRemove, without allowConfigEdit, or with an id that is not a registry id', async () => {
    const { agent: noRemove } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    await expect(noRemove.removeExtension({ id: 'plugin-zod' })).resolves.toMatchObject({ removed: false, reason: 'removing extensions was not granted' })

    const { agent: noEdit } = await connectStudio({ permissions: { allowRemove: true }, kubbBin: '/bin/kubb.js' })
    await expect(noEdit.removeExtension({ id: 'plugin-zod' })).resolves.toMatchObject({ removed: false, reason: 'editing kubb.config.ts was not granted' })

    const { agent: allowed } = await connectStudio({ permissions: { allowRemove: true, allowConfigEdit: true }, kubbBin: '/bin/kubb.js' })
    await expect(allowed.removeExtension({ id: '--yes' })).resolves.toMatchObject({ removed: false, reason: 'the message carried no registry id' })
    expect(x).not.toHaveBeenCalled()
  })

  it('reports a kubb add that could not run instead of throwing', async () => {
    const { agent } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    x.mockRejectedValueOnce(new Error('spawn ENOENT'))

    await expect(agent.installExtension({ id: 'plugin-zod' })).resolves.toStrictEqual({ installed: false, reason: 'kubb add did not run: spawn ENOENT' })
  })

  it('holds off an install, a second save and a generation while a save is still writing the config', async () => {
    const { agent } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    const edit: ConfigEdit = { operation: ConfigEditOperation.DISABLE_PLUGIN, config: 0, plugin: '@kubb/plugin-ts' }
    const save = agent.saveConfig({ edits: [edit] })

    await expect(agent.installExtension({ id: 'plugin-zod' })).resolves.toStrictEqual({ installed: false, reason: 'a save is in progress' })
    await expect(agent.saveConfig({ edits: [edit] })).resolves.toMatchObject({ outcomes: [{ applied: false, reason: 'a save is in progress' }] })
    await expect(agent.startGeneration({ jobId: 'job-1', config: {} }).result()).rejects.toThrow(AgentMessage.SAVE_IN_PROGRESS)
    await expect(save).resolves.toMatchObject({ outcomes: [{ edit }] })
    expect(x).not.toHaveBeenCalled()
  })

  it('lets the next command through once a failed install has settled', async () => {
    const { agent } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })
    exec(1, 'npm ERR! network')
    await expect(agent.installExtension({ id: 'plugin-zod' })).resolves.toMatchObject({ installed: false, reason: 'npm ERR! network' })

    exec(0, 'added 1 package')
    await expect(agent.installExtension({ id: 'plugin-zod' })).resolves.toStrictEqual({ installed: true })
  })

  it('refuses without allowInstall, naming the permission, and runs nothing', async () => {
    const { hooks, heard } = withHooks()
    const warn = heard('studio:warn')
    const { agent } = await connectStudio({ hooks, permissions: { allowConfigEdit: true }, kubbBin: '/bin/kubb.js' })

    await expect(agent.installExtension({ id: 'plugin-zod' })).resolves.toStrictEqual({ installed: false, reason: 'installing extensions was not granted' })
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({ permission: 'allowInstall' }))
    expect(x).not.toHaveBeenCalled()
  })

  it('refuses without allowConfigEdit, since kubb add edits the config', async () => {
    const { agent } = await connectStudio({ permissions: { allowInstall: true }, kubbBin: '/bin/kubb.js' })

    await expect(agent.installExtension({ id: 'plugin-zod' })).resolves.toMatchObject({ reason: 'editing kubb.config.ts was not granted' })
    expect(x).not.toHaveBeenCalled()
  })

  it('refuses an id that is not a registry id before it can become an argument', async () => {
    const { agent } = await connectStudio({ permissions: granted, kubbBin: '/bin/kubb.js' })

    await expect(agent.installExtension({ id: '--allow-exec' })).resolves.toMatchObject({ reason: 'the message carried no registry id' })
    await expect(agent.installExtension(null as never)).resolves.toMatchObject({ reason: 'the message carried no registry id' })
    expect(x).not.toHaveBeenCalled()
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
      data: [{ message: 'Ignored the spec from Studio: generating from a Studio spec is only available to a sandbox or managed agent', info: undefined }],
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
    meta: { title: 'Pet store', circularNames: new Set<string>(), enumNames: new Set<string>() },
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

    await expect(agent.readInput({ jobId: 'job-1' })).resolves.toStrictEqual({ input: JSON.parse(JSON.stringify(toInputJson(input))) })
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
    const edits = [{ operation: ConfigEditOperation.REMOVE_OPTION, plugin: '@kubb/plugin-ts', path: ['enumType'] }] satisfies Parameters<
      AgentApi['saveConfig']
    >[0]['edits']

    await expect(agent.saveConfig({ edits })).resolves.toStrictEqual({
      outcomes: [{ edit: edits[0], applied: false, reason: 'the agent was not granted permission to edit kubb.config.ts' }],
      changed: false,
    })
  })

  async function projectWithConfig() {
    const project = await mkdtemp(join(tmpdir(), 'kubb-save-input-'))
    cleanups.push(() => rm(project, { recursive: true, force: true }))
    await writeFile(join(project, 'kubb.config.ts'), `export default defineConfig({\n  input: './sample.yaml',\n  plugins: [],\n})\n`)
    return project
  }

  it('keeps a pasted spec in openapi.yaml and points input there', async () => {
    const project = await projectWithConfig()
    const { agent } = await connectStudio({
      root: project,
      permissions: { allowConfigEdit: true, allowSaveInput: true },
      connectInfo: { ...info, managed: true },
    })
    const edit: ConfigEdit = { operation: ConfigEditOperation.SET_INPUT, input: 'openapi: 3.1.0\n' }

    await expect(agent.saveConfig({ edits: [edit] })).resolves.toStrictEqual({ outcomes: [{ edit, applied: true }], changed: true })
    expect(await read(join(project, 'openapi.yaml'))).toBe('openapi: 3.1.0\n')
    expect(await read(join(project, 'kubb.config.ts'))).toContain(`input: './openapi.yaml',`)
  })

  it('keeps a pasted JSON spec in openapi.json', async () => {
    const project = await projectWithConfig()
    const { agent } = await connectStudio({
      root: project,
      permissions: { allowConfigEdit: true, allowSaveInput: true },
      connectInfo: { ...info, managed: true },
    })

    await agent.saveConfig({ edits: [{ operation: ConfigEditOperation.SET_INPUT, input: '{"openapi":"3.1.0"}' }] })

    expect(await read(join(project, 'openapi.json'))).toBe('{"openapi":"3.1.0"}')
    expect(await read(join(project, 'kubb.config.ts'))).toContain(`input: './openapi.json',`)
  })

  it('keeps the spec of a second config entry in its own file', async () => {
    const project = await mkdtemp(join(tmpdir(), 'kubb-save-input-'))
    cleanups.push(() => rm(project, { recursive: true, force: true }))
    await writeFile(join(project, 'kubb.config.ts'), `export default defineConfig([{ input: './a.yaml', plugins: [] }, { input: './b.yaml', plugins: [] }])\n`)
    const { agent } = await connectStudio({
      root: project,
      permissions: { allowConfigEdit: true, allowSaveInput: true },
      connectInfo: { ...info, managed: true },
    })

    await agent.saveConfig({ edits: [{ operation: ConfigEditOperation.SET_INPUT, config: 1, input: 'openapi: 3.1.0\n' }] })

    expect(await read(join(project, 'openapi-1.yaml'))).toBe('openapi: 3.1.0\n')
    expect(await read(join(project, 'kubb.config.ts'))).toContain(`input: './openapi-1.yaml'`)
  })

  it('leaves the saved spec alone when the config edit is refused', async () => {
    const project = await mkdtemp(join(tmpdir(), 'kubb-save-input-'))
    cleanups.push(() => rm(project, { recursive: true, force: true }))
    await writeFile(join(project, 'kubb.config.ts'), `export default defineConfig({ input: './openapi.yaml', ...overrides, plugins: [] })\n`)
    await writeFile(join(project, 'openapi.yaml'), 'openapi: 3.0.0\n')
    const { agent } = await connectStudio({
      root: project,
      permissions: { allowConfigEdit: true, allowSaveInput: true },
      connectInfo: { ...info, managed: true },
    })

    await expect(agent.saveConfig({ edits: [{ operation: ConfigEditOperation.SET_INPUT, input: 'openapi: 3.1.0\n' }] })).resolves.toMatchObject({
      outcomes: [{ applied: false }],
      changed: false,
    })
    expect(await read(join(project, 'openapi.yaml'))).toBe('openapi: 3.0.0\n')
  })

  it('refuses a blank spec without writing a file', async () => {
    const project = await projectWithConfig()
    const { agent } = await connectStudio({
      root: project,
      permissions: { allowConfigEdit: true, allowSaveInput: true },
      connectInfo: { ...info, managed: true },
    })
    const edit: ConfigEdit = { operation: ConfigEditOperation.SET_INPUT, input: '  ' }

    await expect(agent.saveConfig({ edits: [edit] })).resolves.toStrictEqual({
      outcomes: [{ edit, applied: false, reason: 'the edit names no input' }],
      changed: false,
    })
    await expect(read(join(project, 'openapi.yaml'))).rejects.toThrow()
  })

  it('refuses to keep a spec without allowSaveInput', async () => {
    const project = await projectWithConfig()
    const { agent } = await connectStudio({ root: project, permissions: { allowConfigEdit: true }, connectInfo: { ...info, managed: true } })
    const edit: ConfigEdit = { operation: ConfigEditOperation.SET_INPUT, input: 'https://example.com/openapi.yaml' }

    await expect(agent.saveConfig({ edits: [edit] })).resolves.toStrictEqual({
      outcomes: [{ edit, applied: false, reason: 'the agent was not granted permission to save the input' }],
      changed: false,
    })
    expect(await read(join(project, 'kubb.config.ts'))).toContain(`input: './sample.yaml',`)
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
