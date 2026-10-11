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
/**
 * Slowest heartbeat a host may ask for. Studio counts an agent offline once its last ping is older
 * than its liveness window, so a slower cadence would make a healthy agent look dead.
 */
const MAX_HEARTBEAT_INTERVAL_MS = 60_000
const PING_TIMEOUT_MS = 10_000
const OPEN_TIMEOUT_MS = 5_000
const MAX_RETRY_DELAY_MS = 30_000
const DISK_SNAPSHOT_MAX_FILES = 10_000
/** A sandbox shares one in-memory generation store across tenants, so old generations expire. */
const SANDBOX_GENERATION_TTL_MS = 15 * 60_000

/**
 * Thrown when Studio closes the socket with {@link AgentCloseCode.UNAUTHORIZED}: the token was
 * revoked or expired, or the agent was deleted. Hosts catch this to forget the token and pair again.
 */
export class InvalidAgentTokenError extends Error {
  constructor(studioUrl: string) {
    super(`Kubb Studio rejected this agent's token. It expired or was revoked, or the agent was deleted in ${studioUrl}.`)
    this.name = 'InvalidAgentTokenError'
  }
}

/**
 * Thrown when Studio closes the socket with {@link AgentCloseCode.INCOMPATIBLE}. Reconnecting cannot
 * help until the agent is upgraded.
 */
export class IncompatibleAgentError extends Error {
  constructor(studioUrl: string, detail?: string) {
    super(`Kubb Studio at ${studioUrl} requires a newer agent${detail ? `: ${detail}` : ''}. Upgrade kubb or the Kubb agent image.`)
    this.name = 'IncompatibleAgentError'
  }
}

export type StudioConnectedContext = AgentConnectInfo & {
  /**
   * The Studio instance this agent connected to.
   */
  url: string
  /**
   * Both sides of the connection, so a host can print them and make a mismatch visible.
   */
  versions: { studio: string; kubb: string; agent: string }
}

/**
 * Events a host hears about its Studio connection, next to the `kubb:*` hooks of each generation.
 */
declare global {
  namespace Kubb {
    interface KubbHooksRegistry {
      /**
       * Studio accepted the agent and finished the handshake. Fired again after each reconnect.
       */
      'studio:connected': [ctx: StudioConnectedContext]
      /**
       * The socket closed. `code` is the WebSocket close code.
       */
      'studio:disconnected': [ctx: { code: number; reason: string }]
      /**
       * Milliseconds until the next connection attempt.
       */
      'studio:reconnecting': [ctx: { delayMs: number }]
      /**
       * A Studio command finished, with what it did: `applied 2/3 edits to kubb.config.ts`.
       */
      'studio:command': [ctx: { command: 'generate' | 'saveConfig' | 'readFiles'; info: string }]
      /**
       * What was refused or ignored, and the missing permission if that is why, so the host can
       * append its own remedy.
       */
      'studio:warn': [ctx: { message: string; permission?: keyof AgentPermissions }]
      /**
       * A failure for the host's own output.
       */
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
   * Loads the Kubb config. Called for every handshake and every generation, so edits on disk show up.
   */
  loadConfig: () => Promise<Config>
  /**
   * The host's own version, reported to Studio next to the runtime's.
   */
  version: string
  /**
   * The project root generation runs against. Defaults to the working directory.
   */
  root?: string
  /**
   * What Studio may do in this project. Every permission is off unless granted.
   */
  permissions?: Partial<AgentPermissions>
  /**
   * Receives the `studio:*` hooks and the `kubb:*` hooks of every generation. Left out, nothing is
   * printed.
   */
  hooks?: Hookable<KubbHooks>
  /**
   * Aborting this closes the socket and ends the connection.
   */
  signal?: AbortSignal
  /**
   * Longest wait between reconnect attempts, in milliseconds.
   *
   * @default 30000
   */
  maxRetryDelay?: number
  /**
   * Milliseconds between keep-alive pings, at most 60000.
   *
   * @default 30000
   */
  heartbeatInterval?: number
}

type ResolvedOptions = Required<Omit<ConnectAgentOptions, 'signal'>> & {
  signal?: AbortSignal
  permissions: AgentPermissions
  /**
   * Absolute path of the config file, for reading and patching it.
   */
  configFile: string
}

/**
 * Why a socket closed. Node fires no `close` event when the handshake itself fails, so that case
 * reports `1006`.
 */
type RpcClose = { code: number; reason: string }

/**
 * One open socket to Studio, seen from the agent.
 */
export type Rpc = { studio: StudioApi; closed: Promise<RpcClose>; close: () => void }

/**
 * Opens the transport. Swapped in tests for an in-process pair.
 */
export type OpenRpc = (input: { url: URL; token: string; instanceId: string; agent: AgentApi }) => Rpc

/**
 * What one socket shares between the loop and the {@link Agent} serving it.
 */
type Session = {
  info?: AgentConnectInfo
  connected: PromiseWithResolvers<void>
  closed: boolean
  active?: { jobId: string; abort: () => void; settled: Promise<void> }
}

/**
 * Calls a host listener without letting it break the connection.
 */
function emit<TName extends keyof KubbHooks & string>(hooks: Hookable<KubbHooks>, name: TName, ...args: KubbHooks[TName]): Promise<void> {
  return Promise.resolve(hooks.callHook(name, ...args)).catch(() => {})
}

/**
 * A fresh root for one sandbox job. Kubb keys its output manifest cache by root, so tenants that
 * shared the agent's own root would read each other's manifest.
 */
function createJobRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'kubb-job-'))
}

/**
 * Removes a job root and the manifest cache Kubb derived from it. Best effort: a leftover temp
 * directory must not fail a job that already finished.
 */
async function removeJobRoot(jobRoot: string): Promise<void> {
  await Promise.all([rm(jobRoot, { recursive: true, force: true }), rm(resolveCacheDir(jobRoot), { recursive: true, force: true })]).catch(() => {})
}

function isValidPage({ cursor, limit }: Pick<ReadFilesInput, 'cursor' | 'limit'>): boolean {
  if (limit === undefined) return cursor === undefined
  if (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 0)) return false
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= MAX_PAGE_LINES
}

class GenerationRunTarget extends RpcTarget implements GenerationRun {
  readonly #stream: ReadableStream<GenerationEvent>
  readonly #result: Promise<GenerateResult>
  readonly #stop: () => void

  constructor(stream: ReadableStream<GenerationEvent>, result: Promise<GenerateResult>, stop: () => void) {
    super()
    this.#stream = stream
    this.#result = result
    this.#stop = stop
  }

  async events() {
    return this.#stream
  }
  result() {
    return this.#result
  }
  async cancel() {
    this.#stop()
  }
  // Cap'n Web also calls this when the peer session is torn down, so a dropped socket stops the run.
  [Symbol.dispose]() {
    this.#stop()
  }
}

/**
 * What Studio reaches over one socket. Cap'n Web exposes only prototype methods, so the public
 * methods here are exactly {@link AgentApi} and everything else stays private.
 */
class Agent extends RpcTarget implements AgentApi {
  readonly #options: ResolvedOptions
  readonly #session: Session
  readonly #limits = resolveGenerationLimits()
  #store: GenerationStore | undefined

  constructor(options: ResolvedOptions, session: Session) {
    super()
    this.#options = options
    this.#session = session
  }

  get #sandbox(): boolean {
    return this.#session.info?.sandbox === true
  }

  get #canWrite(): boolean {
    return !this.#sandbox && this.#options.permissions.allowWrite
  }

  get #canEditConfig(): boolean {
    return !this.#sandbox && this.#options.permissions.allowConfigEdit
  }

  get #canRead(): boolean {
    return this.#sandbox || this.#options.permissions.allowRead
  }

  /**
   * Kept in the project's cache directory so it survives a restart, except on a sandbox: its pool
   * runs every tenant's jobs, so it keeps them in memory. Looked up by job id only.
   */
  get #generations(): GenerationStore {
    this.#store ??= createGenerationStore({
      storage: this.#sandbox ? memoryStorage() : cacheStorage({ root: this.#options.root }),
      maxCount: this.#limits.maxCount,
      maxMb: this.#limits.maxMb,
      ttlMs: this.#sandbox ? SANDBOX_GENERATION_TTL_MS : undefined,
    })
    return this.#store
  }

  #warn(message: string, permission?: keyof AgentPermissions): Promise<void> {
    return emit(this.#options.hooks, 'studio:warn', { message, permission })
  }

  /**
   * Declines a request: logs why locally, then tells Studio. The log names the request that was
   * ignored and the error names what the caller can do.
   */
  async #refuse(reason: string, message: string, permission?: keyof AgentPermissions): Promise<never> {
    await this.#warn(reason, permission)
    throw new Error(message)
  }

  /**
   * Runs one Studio command and reports what it did through `studio:command`.
   */
  async #command<T>(command: KubbHooks['studio:command'][0]['command'], run: () => Promise<{ value: T; info?: string }>): Promise<T> {
    if (!this.#session.info) throw new Error('Studio must call connect() before any other command')
    const { value, info } = await run()
    if (info !== undefined) await emit(this.#options.hooks, 'studio:command', { command, info })
    return value
  }

  /**
   * Reads `kubb.config.ts` and reports which plugin options Studio may edit. Skipped without
   * `allowConfigEdit`. Not cached: the user can edit the file between two Studio actions.
   */
  async #readConfigFileView(source?: string): Promise<ConfigFileView | undefined> {
    if (!this.#canEditConfig) return undefined

    try {
      const { readConfig } = await import('./configFile.ts')
      return readConfig(source ?? (await read(this.#options.configFile)))
    } catch (error) {
      await this.#warn(`Could not read ${this.#options.configFile}: ${getErrorMessage(error)}`)
      return undefined
    }
  }

  async connect(info: AgentConnectInfo): Promise<ConnectMessagePayload> {
    this.#session.info = info
    const { configPath, root, version, loadConfig, permissions } = this.#options
    const [config, file] = await Promise.all([loadConfig(), this.#readConfigFileView()])
    this.#session.connected.resolve()

    return {
      versions: { kubb: kubbVersion, agent: version },
      root,
      config: { path: configPath, file, plugins: config.plugins.map((plugin) => ({ name: toPackageName(plugin.name), options: plugin.options ?? {} })) },
      permissions: { ...permissions, allowWrite: this.#canWrite, allowConfigEdit: this.#canEditConfig, allowRead: this.#canRead },
    }
  }

  startGeneration(input: GenerateInput): GenerationRun {
    const stream = createGenerationStream(this.#options.hooks, input.jobId)
    const controller = new AbortController()
    const result = this.#runGeneration(input, controller).then(
      async (value) => {
        await stream.close()
        return value
      },
      (error: unknown) => {
        stream.fail(error)
        throw error
      },
    )
    // A disconnect can reject this after the remote caller disappeared.
    void result.catch(() => {})

    return new GenerationRunTarget(stream.stream, result, () => {
      controller.abort(new Error('Generation canceled'))
      stream.dispose()
    })
  }

  async #runGeneration(input: GenerateInput, controller: AbortController): Promise<GenerateResult> {
    // Checked before the first `await`, so two calls in the same tick can't both pass.
    if (this.#session.closed) throw new Error('Connection is closed')
    if (this.#session.active) {
      return this.#refuse('Ignored generate: a generation is already in progress', 'A generation is already in progress, please wait for it to finish')
    }
    const settled = Promise.withResolvers<void>()
    this.#session.active = { jobId: input.jobId, abort: () => controller.abort(new Error('Generation canceled')), settled: settled.promise }
    let root = this.#options.root

    try {
      if (this.#sandbox) root = await createJobRoot()
      return await this.#command('generate', () => this.#generate({ input, root, signal: controller.signal }))
    } finally {
      if (root !== this.#options.root) await removeJobRoot(root)
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
      await this.#warn('Ignored the spec from Studio: generating from a Studio spec is only available to a sandbox agent')
    }

    const hasProjectOnDisk = !this.#sandbox && this.#canRead
    const diskFiles = hasProjectOnDisk ? await listDisk({ root, outputPath: config.output.path, maxFiles: DISK_SNAPSHOT_MAX_FILES }) : undefined
    const disk = diskFiles ? await this.#generations.keep({ jobId, source: 'disk', files: diskFiles, maxSetMb: this.#limits.maxSnapshotMb }) : undefined

    const files = await generate({
      config: { ...config, root, input: studioInput ?? config.input, storage: this.#canWrite ? fsStorage() : memoryStorage(), plugins, adapter },
      hooks: this.#options.hooks,
      signal,
      allowExec: this.#options.permissions.allowExec,
    }).catch(async (error: unknown) => {
      await this.#generations.drop(jobId)
      throw error
    })

    const output = await this.#generations.keep({ jobId, source: 'output', files, maxSetMb: this.#limits.maxMb })
    if (!output.paths.length && Object.keys(output.hashes).length) {
      await this.#warn('Kept only the hashes of this generation: its output is too large to keep')
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
      info: `${plugins.length} plugin${plugins.length === 1 ? '' : 's'}, ${this.#canWrite ? 'written to disk' : 'in memory'}${studioInput !== undefined ? ', from a Studio spec' : ''}`,
    }
  }

  saveConfig(input: SaveConfigInput): Promise<SaveResult> {
    return this.#command('saveConfig', () => this.#saveConfig(input))
  }

  async #saveConfig(input: SaveConfigInput): Promise<{ value: SaveResult; info?: string }> {
    const { configPath, configFile } = this.#options

    // `edits` crossed the trust boundary, so check it before walking it.
    if (!Array.isArray(input.edits)) {
      await this.#warn('Ignored save: the message carried no edits')
      return { value: { outcomes: [], changed: false } }
    }

    const edits = input.edits
    const refuse = (reason: string): SaveResult => ({ outcomes: edits.map((edit) => ({ edit, applied: false, reason })), changed: false })

    if (!this.#canEditConfig) {
      await this.#warn('Ignored save: editing kubb.config.ts was not granted')
      return { value: refuse('the agent was not granted permission to edit kubb.config.ts') }
    }

    // A generation reloads the config while it runs, so rewriting the file underneath it would
    // leave that run working from half the change.
    if (this.#session.active) {
      return { value: refuse('a generation is in progress') }
    }

    try {
      const { writeConfigEdits } = await import('./configFile.ts')
      const { source, outcomes, changed } = await writeConfigEdits({ filePath: configFile, edits })
      const applied = outcomes.filter((outcome) => outcome.applied).length

      return {
        value: { outcomes, changed, file: changed ? await this.#readConfigFileView(source) : undefined },
        info: `applied ${applied}/${outcomes.length} edits to ${configPath}`,
      }
    } catch (error) {
      // An unreadable config or a read-only filesystem. Reported as a refusal of every edit so
      // Studio hears back rather than waiting on a reply that never comes.
      await emit(this.#options.hooks, 'studio:error', { error: toError(error) })
      return { value: refuse(getErrorMessage(error)) }
    }
  }

  readFiles(input: ReadFilesInput): Promise<ReadFilesResult> {
    return this.#command('readFiles', () => this.#readFiles(input))
  }

  async #readFiles(input: ReadFilesInput): Promise<{ value: ReadFilesResult; info: string }> {
    if (!this.#canRead) {
      return this.#refuse('Ignored files: reading generated files was not granted', 'The agent was not granted permission to read generated files', 'allowRead')
    }
    // `paths` came off the wire, so check its shape before walking it.
    if (!Array.isArray(input.paths)) {
      return this.#refuse('Ignored files: the message carried no paths', 'The request carried no paths')
    }
    const { paths } = input
    if (paths.length > MAX_FILES_PER_REQUEST) {
      return this.#refuse(
        `Ignored files: requested ${paths.length} paths, more than the ${MAX_FILES_PER_REQUEST} allowed per request`,
        `At most ${MAX_FILES_PER_REQUEST} paths may be requested at once`,
      )
    }
    if (typeof input.jobId !== 'string' || !input.jobId) {
      return this.#refuse('Ignored files: the message named no job', 'The request named no generation job')
    }

    const generation = await this.#generations.get(input.jobId)
    if (!generation) {
      return this.#refuse(`Ignored files: job ${input.jobId} is not kept on this agent`, GENERATION_GONE_MESSAGE)
    }
    if (!isValidPage(input)) {
      return this.#refuse(
        'Ignored files: the message carried an invalid page',
        `The cursor must be a whole line from 0 and come with a limit of 1 to ${MAX_PAGE_LINES} lines`,
      )
    }

    const source = input.source === 'disk' ? 'disk' : 'output'
    if (!generation[source]) {
      return this.#refuse('Ignored files: that job has no snapshot of the files on disk', 'This agent kept no snapshot of the files on disk for that job')
    }

    // Only paths the set holds are read, never an arbitrary path.
    const result = await this.#generations.read({ generation, source, paths, cursor: input.cursor, limit: input.limit })

    return { value: result, info: `read ${Object.keys(result.files).length}/${paths.length} requested file${paths.length === 1 ? '' : 's'}` }
  }
}

/**
 * Opens the agent socket and attaches Cap'n Web RPC to it, closing the socket when the handshake
 * takes longer than {@link OPEN_TIMEOUT_MS}.
 */
const openWebSocketRpc: OpenRpc = ({ url, token, instanceId, agent }) => {
  // Node's `WebSocket` takes undici's `headers` option, which the DOM typing leaves out.
  const NodeWebSocket = WebSocket as unknown as new (url: URL, init: { headers: Record<string, string> }) => WebSocket
  const socket = new NodeWebSocket(url, { headers: { Authorization: `Bearer ${token}`, [AGENT_INSTANCE_HEADER]: instanceId } })
  const timer = setTimeout(() => socket.close(3008, 'Connection timeout'), OPEN_TIMEOUT_MS)
  socket.addEventListener('open', () => clearTimeout(timer), { once: true })

  const closed = new Promise<RpcClose>((resolve) => {
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

/**
 * Serves one socket until it closes, then waits for its generation to stop.
 */
async function runSession(options: ResolvedOptions, openRpc: OpenRpc, { url, instanceId }: { url: URL; instanceId: string }) {
  const { hooks, signal, heartbeatInterval, token, studioUrl, version } = options
  const session: Session = { connected: Promise.withResolvers(), closed: false }
  const rpc = openRpc({ url, token, instanceId, agent: new Agent(options, session) })
  const stop = () => rpc.close()
  signal?.addEventListener('abort', stop, { once: true })
  let timer: ReturnType<typeof setTimeout> | undefined

  // Races each ping against a deadline, so a half-open socket can't hang it forever.
  const heartbeat = async (): Promise<void> => {
    const ping = Promise.resolve(rpc.studio.ping())
    void ping.catch(() => {})
    let deadline: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([ping, new Promise((_, reject) => (deadline = setTimeout(() => reject(new Error('Heartbeat timed out')), PING_TIMEOUT_MS)))])
    } catch {
      rpc.close()
      return
    } finally {
      clearTimeout(deadline)
    }
    if (!session.closed) timer = setTimeout(heartbeat, heartbeatInterval)
  }

  void session.connected.promise.then(
    async () => {
      const info = session.info!
      await emit(hooks, 'studio:connected', { ...info, url: studioUrl, versions: { studio: info.studioVersion, kubb: kubbVersion, agent: version } })
      if (!session.closed) timer = setTimeout(heartbeat, heartbeatInterval)
    },
    () => {},
  )

  const close = await rpc.closed
  session.closed = true
  clearTimeout(timer)
  signal?.removeEventListener('abort', stop)
  session.connected.reject(new Error('The socket closed before Studio called connect()'))
  session.active?.abort()
  await session.active?.settled

  return { ...close, connected: session.info !== undefined }
}

/**
 * Runs the connection loop with a swappable transport. {@link connectAgent} is this with a real
 * WebSocket.
 */
export async function runAgent(options: ConnectAgentOptions, openRpc: OpenRpc): Promise<void> {
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
  const url = secureUrl(studioUrl, AGENT_SOCKET_PATH, { socket: true })
  // One per call, so a reconnect is the same process to Studio and a restart is a new one.
  const instanceId = randomUUID()
  let attempt = 0

  while (!signal?.aborted) {
    const { code, reason, connected } = await runSession(resolved, openRpc, { url, instanceId })
    if (signal?.aborted) return
    await emit(hooks, 'studio:disconnected', { code, reason })

    if (code === AgentCloseCode.UNAUTHORIZED) throw new InvalidAgentTokenError(studioUrl)
    if (code === AgentCloseCode.INCOMPATIBLE) throw new IncompatibleAgentError(studioUrl, reason)
    if (code === AgentCloseCode.SUPERSEDED) return

    // Reset only once Studio called connect(), so a socket that opens and closes again backs off.
    if (connected) attempt = 0
    const delayMs = Math.random() * Math.min(1_000 * 2 ** Math.min(attempt++, 16), maxRetryDelay)
    await emit(hooks, 'studio:reconnecting', { delayMs })
    await delay(delayMs, undefined, { signal }).catch(() => {})
  }
}

/**
 * Connects this project to Kubb Studio and serves its commands until `signal` aborts.
 *
 * Reconnects with capped, jittered backoff whenever the socket drops. Resolves on shutdown or when
 * another process of the same agent takes over. Rejects with {@link InvalidAgentTokenError} when
 * Studio refuses the token, so the host can pair again, and with {@link IncompatibleAgentError}
 * when the agent is too old.
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
  return runAgent(options, openWebSocketRpc)
}
