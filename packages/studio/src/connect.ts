import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { getErrorMessage, read, toError } from '@internals/utils'
import { cacheStorage, type Config, fsStorage, Hookable, type KubbHooks, memoryStorage, resolveCacheDir } from '@kubb/core'
import { newWebSocketRpcSession, RpcTarget } from 'capnweb'
import { version as kubbVersion } from '../package.json'
import { readConfig, writeConfigEdits } from './configFile.ts'
import { createGenerationStream } from './generationEvents.ts'
import { createGenerationStore, generate, type GenerationStore, listDisk, resolveGenerationLimits } from './generations.ts'
import {
  AGENT_INSTANCE_HEADER,
  AGENT_SOCKET_PATH,
  type AgentApi,
  AgentCloseCode,
  type AgentConnectInfo,
  type AgentPermissions,
  type ConfigFileView,
  type ConnectMessagePayload,
  type GenerateInput,
  type GenerateResult,
  type GenerationEvent,
  type GenerationRun,
  GENERATION_GONE_MESSAGE,
  MAX_FILES_PER_REQUEST,
  MAX_PAGE_LINES,
  type ReadFilesInput,
  type ReadFilesResult,
  type SaveConfigInput,
  type SaveResult,
  type StudioApi,
} from './protocol.ts'
import { mergeAdapter, mergePlugins, toPackageName } from './resolveConfig.ts'
import { defaultStudioUrl, secureUrl } from './url.ts'

const HEARTBEAT_INTERVAL_MS = 30_000
// Studio marks an agent offline after its liveness window, so a slower cadence would look dead.
const MAX_HEARTBEAT_INTERVAL_MS = 60_000
const PING_TIMEOUT_MS = 10_000
const OPEN_TIMEOUT_MS = 5_000
const MAX_RETRY_DELAY_MS = 30_000
const DISK_SNAPSHOT_MAX_FILES = 10_000
// A sandbox shares one in-memory store across tenants, so old generations expire.
const SANDBOX_GENERATION_TTL_MS = 15 * 60_000

/**
 * Studio closed with {@link AgentCloseCode.UNAUTHORIZED}. Hosts forget the token and pair again.
 */
export class InvalidAgentTokenError extends Error {
  constructor(studioUrl: string) {
    super(`Kubb Studio rejected this agent's token. It expired or was revoked, or the agent was deleted in ${studioUrl}.`)
    this.name = 'InvalidAgentTokenError'
  }
}

/**
 * Studio closed with {@link AgentCloseCode.INCOMPATIBLE}. Only an upgrade helps.
 */
export class IncompatibleAgentError extends Error {
  constructor({ studioUrl, detail }: { studioUrl: string; detail?: string }) {
    super(`Kubb Studio at ${studioUrl} requires a newer agent${detail ? `: ${detail}` : ''}. Upgrade kubb or the Kubb agent image.`)
    this.name = 'IncompatibleAgentError'
  }
}

export type StudioConnectedContext = AgentConnectInfo & {
  url: string
  /**
   * The Studio, runtime, and host versions, so a host can show a mismatch.
   */
  versions: { studio: string; kubb: string; agent: string }
}

declare global {
  namespace Kubb {
    interface KubbHooksRegistry {
      /**
       * Fired after each handshake, including reconnects.
       */
      'studio:connected': [ctx: StudioConnectedContext]
      'studio:disconnected': [ctx: { code: number; reason: string }]
      'studio:reconnecting': [ctx: { delayMs: number }]
      /**
       * A finished command and what it did, such as `applied 2/3 edits to kubb.config.ts`.
       */
      'studio:command': [ctx: { command: 'generate' | 'saveConfig' | 'readFiles'; info: string }]
      /**
       * A refused or ignored request, with the missing permission so the host can add a remedy.
       */
      'studio:warn': [ctx: { message: string; permission?: keyof AgentPermissions }]
      'studio:error': [ctx: { error: Error }]
    }
  }
}

export type ConnectAgentOptions = {
  /**
   * The agent's bearer token, from {@link pairAgent}.
   */
  token: string
  studioUrl?: string
  /**
   * The config path shown in Studio, relative to `root` unless absolute.
   */
  configPath: string
  /**
   * Called for every handshake and every generation, so edits on disk show up.
   */
  loadConfig: () => Promise<Config>
  /**
   * The host's own version, reported to Studio next to the runtime's.
   */
  version: string
  /**
   * The project root generation runs against.
   * @default process.cwd()
   */
  root?: string
  /**
   * What Studio may do in this project. Every permission is off unless granted.
   */
  permissions?: Partial<AgentPermissions>
  /**
   * Receives the `studio:*` hooks and the `kubb:*` hooks of every generation.
   */
  hooks?: Hookable<KubbHooks>
  signal?: AbortSignal
  /**
   * Longest wait between reconnect attempts, in milliseconds.
   * @default 30000
   */
  maxRetryDelay?: number
  /**
   * Milliseconds between keep-alive pings, at most 60000.
   * @default 30000
   */
  heartbeatInterval?: number
}

type ResolvedOptions = Required<Omit<ConnectAgentOptions, 'signal'>> & {
  signal?: AbortSignal
  permissions: AgentPermissions
  configFile: string
}

type Rpc = { studio: StudioApi; closed: Promise<{ code: number; reason: string }>; close: () => void }

// Tests swap in an in-process pair.
export type OpenRpc = (input: { url: URL; token: string; instanceId: string; agent: AgentApi }) => Rpc

type Session = {
  info?: AgentConnectInfo
  connected: PromiseWithResolvers<AgentConnectInfo>
  closed: boolean
  active?: { jobId: string; abort: () => void; settled: Promise<void> }
}

// A throwing host listener must not break the connection.
function emit<TName extends keyof KubbHooks & string>(hooks: Hookable<KubbHooks>, name: TName, ...args: KubbHooks[TName]): Promise<void> {
  return Promise.resolve(hooks.callHook(name, ...args)).catch(() => {})
}

function isValidPage({ cursor, limit }: Pick<ReadFilesInput, 'cursor' | 'limit'>): boolean {
  if (limit === undefined) return cursor === undefined
  if (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 0)) return false
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= MAX_PAGE_LINES
}

type RunHandle = { stream: ReadableStream<GenerationEvent>; result: Promise<GenerateResult>; stop: () => void }

class GenerationRunTarget extends RpcTarget implements GenerationRun {
  readonly #run: RunHandle

  constructor(run: RunHandle) {
    super()
    this.#run = run
  }

  async events() {
    return this.#run.stream
  }
  result() {
    return this.#run.result
  }
  async cancel() {
    this.#run.stop()
  }
  // Cap'n Web also calls this when the peer session is torn down, so a dropped socket stops the run.
  [Symbol.dispose]() {
    this.#run.stop()
  }
}

// Cap'n Web exposes only prototype methods, so the public methods are exactly `AgentApi`.
class Agent extends RpcTarget implements AgentApi {
  readonly #options: ResolvedOptions
  readonly #session: Session
  readonly #limits = resolveGenerationLimits()
  #store: GenerationStore | undefined

  constructor({ options, session }: { options: ResolvedOptions; session: Session }) {
    super()
    this.#options = options
    this.#session = session
  }

  get #sandbox(): boolean {
    return this.#session.info?.sandbox === true
  }

  // A sandbox has no project to write to or edit, and Studio may always read what it generated there.
  get #permissions(): AgentPermissions {
    const { permissions } = this.#options
    return this.#sandbox ? { ...permissions, allowWrite: false, allowConfigEdit: false, allowRead: true } : permissions
  }

  // Kept in the project's cache directory so it survives a restart. A sandbox keeps them in memory,
  // because its pool runs every tenant's jobs.
  get #generations(): GenerationStore {
    this.#store ??= createGenerationStore({
      storage: this.#sandbox ? memoryStorage() : cacheStorage({ root: this.#options.root }),
      maxCount: this.#limits.maxCount,
      maxMb: this.#limits.maxMb,
      ttlMs: this.#sandbox ? SANDBOX_GENERATION_TTL_MS : undefined,
    })
    return this.#store
  }

  #warn({ message, permission }: { message: string; permission?: keyof AgentPermissions }): Promise<void> {
    return emit(this.#options.hooks, 'studio:warn', { message, permission })
  }

  // Studio shows the thrown message, and the host logs the same text.
  async #refuse({ message, permission }: { message: string; permission?: keyof AgentPermissions }): Promise<never> {
    await this.#warn({ message, permission })
    throw new Error(message)
  }

  async #command<T>({ command, run }: { command: KubbHooks['studio:command'][0]['command']; run: () => Promise<{ value: T; info?: string }> }): Promise<T> {
    if (!this.#session.info) throw new Error('Studio must call connect() before any other command')
    const { value, info } = await run()
    if (info !== undefined) await emit(this.#options.hooks, 'studio:command', { command, info })
    return value
  }

  // Not cached: the user can edit the file between two Studio actions.
  async #readConfigFileView(source?: string): Promise<ConfigFileView | undefined> {
    if (!this.#permissions.allowConfigEdit) return undefined

    try {
      return readConfig(source ?? (await read(this.#options.configFile)))
    } catch (error) {
      await this.#warn({ message: `Could not read ${this.#options.configFile}: ${getErrorMessage(error)}` })
      return undefined
    }
  }

  async connect(info: AgentConnectInfo): Promise<ConnectMessagePayload> {
    this.#session.info = info
    const { configPath, root, version, loadConfig } = this.#options
    const [config, file] = await Promise.all([loadConfig(), this.#readConfigFileView()])
    this.#session.connected.resolve(info)

    return {
      versions: { kubb: kubbVersion, agent: version },
      root,
      config: { path: configPath, file, plugins: config.plugins.map((plugin) => ({ name: toPackageName(plugin.name), options: plugin.options ?? {} })) },
      permissions: this.#permissions,
    }
  }

  startGeneration(input: GenerateInput): GenerationRun {
    const stream = createGenerationStream(this.#options.hooks, input.jobId)
    const controller = new AbortController()
    const result = this.#runGeneration(input, controller).then(
      (value) => stream.close().then(() => value),
      (error: unknown) => {
        stream.fail(error)
        throw error
      },
    )
    // A disconnect can reject this after the remote caller disappeared.
    void result.catch(() => {})

    return new GenerationRunTarget({
      stream: stream.stream,
      result,
      stop: () => {
        controller.abort(new Error('Generation canceled'))
        stream.dispose()
      },
    })
  }

  async #runGeneration(input: GenerateInput, controller: AbortController): Promise<GenerateResult> {
    // Checked before the first `await`, so two calls in the same tick can't both pass.
    if (this.#session.closed) throw new Error('Connection is closed')
    if (this.#session.active) return this.#refuse({ message: 'A generation is already in progress, please wait for it to finish' })
    const settled = Promise.withResolvers<void>()
    this.#session.active = { jobId: input.jobId, abort: () => controller.abort(new Error('Generation canceled')), settled: settled.promise }
    let root = this.#options.root

    try {
      // Kubb keys its manifest cache by root, so sandbox tenants sharing one root would read each other's.
      if (this.#sandbox) root = await mkdtemp(path.join(tmpdir(), 'kubb-job-'))
      return await this.#command({ command: 'generate', run: () => this.#generate({ input, root, signal: controller.signal }) })
    } finally {
      if (root !== this.#options.root) {
        await Promise.all([rm(root, { recursive: true, force: true }), rm(resolveCacheDir(root), { recursive: true, force: true })]).catch(() => {})
      }
      this.#session.active = undefined
      settled.resolve()
    }
  }

  async #generate({ input, root, signal }: { input: GenerateInput; root: string; signal: AbortSignal }): Promise<{ value: GenerateResult; info: string }> {
    const { jobId, config: patch } = input
    const config = await this.#options.loadConfig()
    const plugins = (await mergePlugins(config.plugins, patch?.plugins)) ?? config.plugins
    const adapter = await mergeAdapter(config.adapter, patch?.adapter)
    // A sandbox has no spec on disk, so it always generates from Studio's, empty string included.
    const studioInput = this.#sandbox ? (patch?.input ?? '') : undefined

    if (patch?.input && !this.#sandbox) {
      await this.#warn({ message: 'Ignored the spec from Studio: generating from a Studio spec is only available to a sandbox agent' })
    }

    const hasProjectOnDisk = !this.#sandbox && this.#permissions.allowRead
    const diskFiles = hasProjectOnDisk ? await listDisk({ root, outputPath: config.output.path, maxFiles: DISK_SNAPSHOT_MAX_FILES }) : undefined
    const disk = diskFiles ? await this.#generations.keep({ jobId, source: 'disk', files: diskFiles, maxSetMb: this.#limits.maxSnapshotMb }) : undefined

    const files = await generate({
      config: { ...config, root, input: studioInput ?? config.input, storage: this.#permissions.allowWrite ? fsStorage() : memoryStorage(), plugins, adapter },
      hooks: this.#options.hooks,
      signal,
      allowExec: this.#permissions.allowExec,
    }).catch(async (error: unknown) => {
      await this.#generations.drop(jobId)
      throw error
    })

    const output = await this.#generations.keep({ jobId, source: 'output', files, maxSetMb: this.#limits.maxMb })
    if (!output.paths.length && Object.keys(output.hashes).length) {
      await this.#warn({ message: 'Kept only the hashes of this generation: its output is too large to keep' })
    }
    await this.#generations.add({ jobId, output, disk })

    return {
      value: {
        status: 'success',
        files: [...files.paths],
        fileCount: files.paths.size,
        hashes: output.hashes,
        disk: disk ? { hashes: disk.hashes } : undefined,
      },
      info: `${plugins.length} plugin${plugins.length === 1 ? '' : 's'}, ${this.#permissions.allowWrite ? 'written to disk' : 'in memory'}${studioInput !== undefined ? ', from a Studio spec' : ''}`,
    }
  }

  saveConfig(input: SaveConfigInput): Promise<SaveResult> {
    return this.#command({ command: 'saveConfig', run: () => this.#saveConfig(input) })
  }

  async #saveConfig(input: SaveConfigInput): Promise<{ value: SaveResult; info?: string }> {
    const { configPath, configFile } = this.#options

    if (!Array.isArray(input.edits)) {
      await this.#warn({ message: 'Ignored save: the message carried no edits' })
      return { value: { outcomes: [], changed: false } }
    }

    const edits = input.edits
    const refuse = (reason: string): SaveResult => ({ outcomes: edits.map((edit) => ({ edit, applied: false, reason })), changed: false })

    if (!this.#permissions.allowConfigEdit) {
      await this.#warn({ message: 'Ignored save: editing kubb.config.ts was not granted' })
      return { value: refuse('the agent was not granted permission to edit kubb.config.ts') }
    }

    // A running generation reloads the config, so it would see half the change.
    if (this.#session.active) return { value: refuse('a generation is in progress') }

    try {
      const { source, outcomes, changed } = await writeConfigEdits({ filePath: configFile, edits })
      const applied = outcomes.filter((outcome) => outcome.applied).length

      return {
        value: { outcomes, changed, file: changed ? await this.#readConfigFileView(source) : undefined },
        info: `applied ${applied}/${outcomes.length} edits to ${configPath}`,
      }
    } catch (error) {
      // Refuse every edit so Studio hears back instead of waiting.
      await emit(this.#options.hooks, 'studio:error', { error: toError(error) })
      return { value: refuse(getErrorMessage(error)) }
    }
  }

  readFiles(input: ReadFilesInput): Promise<ReadFilesResult> {
    return this.#command({ command: 'readFiles', run: () => this.#readFiles(input) })
  }

  async #readFiles(input: ReadFilesInput): Promise<{ value: ReadFilesResult; info: string }> {
    if (!this.#permissions.allowRead) return this.#refuse({ message: 'The agent was not granted permission to read generated files', permission: 'allowRead' })
    if (!Array.isArray(input.paths) || typeof input.jobId !== 'string' || !input.jobId) {
      return this.#refuse({ message: 'The request must name a job and carry paths' })
    }
    const { paths } = input
    if (paths.length > MAX_FILES_PER_REQUEST) return this.#refuse({ message: `At most ${MAX_FILES_PER_REQUEST} paths may be requested at once` })

    const generation = await this.#generations.get(input.jobId)
    if (!generation) return this.#refuse({ message: GENERATION_GONE_MESSAGE })
    if (!isValidPage(input)) return this.#refuse({ message: `The cursor must be a whole line from 0 and come with a limit of 1 to ${MAX_PAGE_LINES} lines` })

    const source = input.source === 'disk' ? 'disk' : 'output'
    if (!generation[source]) return this.#refuse({ message: 'This agent kept no snapshot of the files on disk for that job' })

    // Only paths the set holds are read, never an arbitrary path.
    const result = await this.#generations.read({ generation, source, paths, cursor: input.cursor, limit: input.limit })

    return { value: result, info: `read ${Object.keys(result.files).length}/${paths.length} requested file${paths.length === 1 ? '' : 's'}` }
  }
}

const openWebSocketRpc: OpenRpc = ({ url, token, instanceId, agent }) => {
  // Node's `WebSocket` takes undici's `headers` option, which the DOM typing leaves out.
  const NodeWebSocket = WebSocket as unknown as new (url: URL, init: { headers: Record<string, string> }) => WebSocket
  const socket = new NodeWebSocket(url, { headers: { Authorization: `Bearer ${token}`, [AGENT_INSTANCE_HEADER]: instanceId } })
  const timer = setTimeout(() => socket.close(3008, 'Connection timeout'), OPEN_TIMEOUT_MS)
  socket.addEventListener('open', () => clearTimeout(timer), { once: true })

  const closed = new Promise<Awaited<Rpc['closed']>>((resolve) => {
    socket.addEventListener('close', ({ code, reason }) => resolve({ code, reason }), { once: true })
    // Node fires only `error` when the handshake itself fails.
    socket.addEventListener('error', () => {
      if (socket.readyState !== WebSocket.OPEN) resolve({ code: 1006, reason: '' })
    })
  }).finally(() => clearTimeout(timer))

  const studio = newWebSocketRpcSession<StudioApi>(socket, agent)
  studio.onRpcBroken(() => socket.close())

  return {
    studio,
    closed,
    close: () => {
      studio[Symbol.dispose]()
      socket.close()
    },
  }
}

async function runSession({ options, openRpc, url, instanceId }: { options: ResolvedOptions; openRpc: OpenRpc; url: URL; instanceId: string }) {
  const { hooks, signal, heartbeatInterval, token, studioUrl, version } = options
  const session: Session = { connected: Promise.withResolvers(), closed: false }
  const rpc = openRpc({ url, token, instanceId, agent: new Agent({ options, session }) })
  signal?.addEventListener('abort', rpc.close, { once: true })
  let timer: ReturnType<typeof setTimeout> | undefined

  // Races each ping against a deadline, so a half-open socket can't hang it forever.
  const heartbeat = async (): Promise<void> => {
    let deadline: ReturnType<typeof setTimeout> | undefined
    const timedOut = new Promise<boolean>((resolve) => (deadline = setTimeout(resolve, PING_TIMEOUT_MS, true)))
    const failed = await Promise.race([
      Promise.resolve(rpc.studio.ping()).then(
        () => false,
        () => true,
      ),
      timedOut,
    ])
    clearTimeout(deadline)
    if (failed) return rpc.close()
    if (!session.closed) timer = setTimeout(heartbeat, heartbeatInterval)
  }

  void session.connected.promise.then(
    async (info) => {
      await emit(hooks, 'studio:connected', { ...info, url: studioUrl, versions: { studio: info.studioVersion, kubb: kubbVersion, agent: version } })
      if (!session.closed) timer = setTimeout(heartbeat, heartbeatInterval)
    },
    () => {},
  )

  const close = await rpc.closed
  session.closed = true
  clearTimeout(timer)
  signal?.removeEventListener('abort', rpc.close)
  session.connected.reject(new Error('The socket closed before Studio called connect()'))
  session.active?.abort()
  await session.active?.settled

  return { ...close, connected: session.info !== undefined }
}

/**
 * The connection loop with a swappable transport. {@link connectAgent} passes a real WebSocket.
 */
export async function runAgent({ options, openRpc }: { options: ConnectAgentOptions; openRpc: OpenRpc }): Promise<void> {
  const root = options.root ?? process.cwd()
  const resolved: ResolvedOptions = {
    ...options,
    studioUrl: options.studioUrl ?? defaultStudioUrl,
    root,
    configFile: path.resolve(root, options.configPath),
    permissions: { allowWrite: false, allowConfigEdit: false, allowExec: false, allowRead: false, ...options.permissions },
    hooks: options.hooks ?? new Hookable<KubbHooks>(),
    maxRetryDelay: options.maxRetryDelay ?? MAX_RETRY_DELAY_MS,
    heartbeatInterval: Math.min(options.heartbeatInterval ?? HEARTBEAT_INTERVAL_MS, MAX_HEARTBEAT_INTERVAL_MS),
  }
  const { studioUrl, hooks, signal, maxRetryDelay } = resolved
  const url = secureUrl({ studioUrl, path: AGENT_SOCKET_PATH, socket: true })
  // One per call, so a reconnect is the same process to Studio and a restart is a new one.
  const instanceId = randomUUID()
  let attempt = 0

  while (!signal?.aborted) {
    const { code, reason, connected } = await runSession({ options: resolved, openRpc, url, instanceId })
    if (signal?.aborted) return
    await emit(hooks, 'studio:disconnected', { code, reason })

    if (code === AgentCloseCode.UNAUTHORIZED) throw new InvalidAgentTokenError(studioUrl)
    if (code === AgentCloseCode.INCOMPATIBLE) throw new IncompatibleAgentError({ studioUrl, detail: reason })
    if (code === AgentCloseCode.SUPERSEDED) return

    // Reset only once Studio called connect(), so a socket that opens and closes again backs off.
    if (connected) attempt = 0
    const delayMs = Math.random() * Math.min(1_000 * 2 ** Math.min(attempt++, 16), maxRetryDelay)
    await emit(hooks, 'studio:reconnecting', { delayMs })
    await delay(delayMs, undefined, { signal }).catch(() => {})
  }
}

/**
 * Connects this project to Kubb Studio and serves its commands until `signal` aborts. Reconnects
 * with jittered backoff, and resolves when another process of the agent takes over. Rejects with
 * {@link InvalidAgentTokenError} so the host can pair again, or {@link IncompatibleAgentError}.
 *
 * @example
 * ```ts
 * const hooks = new Hookable<KubbHooks>()
 * hooks.hook('studio:connected', ({ agentSlug }) => console.log(`Connected as ${agentSlug}`))
 *
 * await connectAgent({ token, configPath: 'kubb.config.ts', loadConfig, version: '1.0.0', hooks, signal })
 * ```
 */
export function connectAgent(options: ConnectAgentOptions): Promise<void> {
  return runAgent({ options, openRpc: openWebSocketRpc })
}
