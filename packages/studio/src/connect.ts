import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { getErrorMessage, read, toError } from '@internals/utils'
import {
  Diagnostics,
  cacheStorage,
  type Config,
  fsStorage,
  getInputKind,
  Hookable,
  type KubbHooks,
  memoryStorage,
  readInstalledPackages,
  resolveCacheDir,
  resolveMeta,
} from '@kubb/core'
import { newWebSocketRpcSession, RpcTarget } from 'capnweb'
import { version as kubbVersion } from '../package.json'
import { readConfig, readImports, writeConfigEdits } from './configFile.ts'
import { diffHunks, pageHunks } from './diff.ts'
import { createGenerationStream } from './generationEvents.ts'
import { createGenerationStore, generate, type GenerationStore, listDisk, resolveGenerationLimits } from './generations.ts'
import {
  AGENT_INSTANCE_HEADER,
  AGENT_SOCKET_PATH,
  type AgentApi,
  AgentPermission,
  AgentCloseCode,
  AgentMessage,
  type AgentConnectInfo,
  type AgentPermissions,
  type ConfigFileView,
  type ConnectMessagePayload,
  FileSource,
  type GenerateInput,
  type GenerateResult,
  type GenerationEvent,
  type GenerationRun,
  type InstalledExtensions,
  MAX_FILES_PER_REQUEST,
  MAX_PAGE_LINES,
  type ReadDiffInput,
  type ReadDiffResult,
  type ReadFilesInput,
  type ReadFilesResult,
  type ReadInputInput,
  type ReadInputResult,
  type SaveConfigInput,
  type SaveResult,
  type StudioApi,
} from './protocol.ts'
import { mergeAdapter, mergeParsers, mergePlugins, toJSONOptions, toStudioName } from './resolveConfig.ts'
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
/** Extensions `kubb` ships with, so they count as installed without being a direct dependency. */
const BUILT_IN_PACKAGES = ['@kubb/adapter-oas', '@kubb/parser-ts', '@kubb/parser-md', '@kubb/plugin-barrel']

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
      'studio:command': [ctx: { command: 'generate' | 'saveConfig' | 'readFiles' | 'readInput' | 'readDiff'; info: string }]
      /**
       * A refused or ignored request, with the missing permission so the host can add a remedy.
       */
      'studio:warn': [ctx: { message: string; permission?: AgentPermission }]
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
  // Kept sets never change, so a diff is computed once and its pages are cut from it.
  readonly #diffs = new Map<string, ReturnType<typeof diffHunks>>()

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
    return this.#sandbox ? { ...permissions, allowWrite: false, allowConfigEdit: false, allowRead: true, allowReadAst: true } : permissions
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

  #warn({ message, permission }: { message: string; permission?: AgentPermission }): Promise<void> {
    return emit(this.#options.hooks, 'studio:warn', { message, permission })
  }

  // Studio shows the thrown message, and the host logs the same text.
  async #refuse({ message, permission }: { message: string; permission?: AgentPermission }): Promise<never> {
    await this.#warn({ message, permission })
    throw new Diagnostics.Error({ code: Diagnostics.code.unknown, severity: 'error', message })
  }

  #assertConnected(): void {
    if (!this.#session.info)
      throw new Diagnostics.Error({ code: Diagnostics.code.internalError, severity: 'error', message: 'Studio must call connect() before any other command' })
  }

  #logCommand(command: KubbHooks['studio:command'][0]['command'], info: string): Promise<void> {
    return emit(this.#options.hooks, 'studio:command', { command, info })
  }

  // Not cached: the user can edit the file between two Studio actions.
  async #readConfigFileView(source: Promise<string>): Promise<ConfigFileView | undefined> {
    if (!this.#permissions.allowConfigEdit) return undefined

    try {
      return readConfig(await source)
    } catch (error) {
      await this.#warn({ message: `Could not read ${this.#options.configFile}: ${getErrorMessage(error)}` })
      return undefined
    }
  }

  // Not cached either: the user can install a plugin while the agent runs. Keeps each project
  // dependency, config import and built-in that resolves and ships a valid `kubb-extension.json`.
  async #installedExtensions(source = read(this.#options.configFile)): Promise<InstalledExtensions> {
    const imports = await source.then(readImports, () => [])
    const installed = await readInstalledPackages({ root: this.#options.root, packages: [...imports, ...BUILT_IN_PACKAGES], resolveFrom: ['kubb'] })

    return new Map(
      installed.flatMap(({ package: name, version, manifest }) =>
        version !== undefined && manifest ? [[name, { package: name, version, manifest }] as const] : [],
      ),
    )
  }

  async connect(info: AgentConnectInfo): Promise<ConnectMessagePayload> {
    this.#session.info = info
    const { configPath, root, version, loadConfig, configFile } = this.#options
    const source = read(configFile)
    const [config, file, extensions] = await Promise.all([loadConfig(), this.#readConfigFileView(source), this.#installedExtensions(source)])
    this.#session.connected.resolve(info)

    return {
      versions: { kubb: kubbVersion, agent: version },
      root,
      // Copied through JSON: Cap'n Web would otherwise pass every function in the options as a stub
      // Studio could call, running the user's config code in this process.
      config: {
        path: configPath,
        file,
        plugins: config.plugins.map((plugin) => ({
          name: toStudioName({ name: resolveMeta(plugin).name, extensions }),
          options: toJSONOptions(plugin.options),
        })),
        adapter: config.adapter && {
          name: toStudioName({ name: resolveMeta(config.adapter).name, extensions, kind: 'adapter' }),
          options: toJSONOptions(config.adapter.options),
        },
        parsers: config.parsers.map((parser) => ({
          name: toStudioName({ name: resolveMeta(parser).name, extensions, kind: 'parser' }),
          options: toJSONOptions(parser.options),
        })),
        extensions: [...extensions.values()],
      },
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
        stream.fail()
      },
    })
  }

  /** Runs one job and keeps its output, and its input with `allowRead`, for later reads. */
  async #runGeneration(input: GenerateInput, controller: AbortController): Promise<GenerateResult> {
    this.#assertConnected()
    // Checked before the first `await`, so two calls in the same tick can't both pass.
    if (this.#session.closed) throw new Diagnostics.Error({ code: Diagnostics.code.internalError, severity: 'error', message: 'Connection is closed' })
    if (this.#session.active) return this.#refuse({ message: 'A generation is already in progress, please wait for it to finish' })
    const settled = Promise.withResolvers<void>()
    this.#session.active = { jobId: input.jobId, abort: () => controller.abort(new Error('Generation canceled')), settled: settled.promise }
    let root = this.#options.root

    try {
      // Kubb keys its manifest cache by root, so sandbox tenants sharing one root would read each other's.
      if (this.#sandbox) root = await mkdtemp(path.join(tmpdir(), 'kubb-job-'))
      return await this.#generate({ input, root, signal: controller.signal })
    } finally {
      if (root !== this.#options.root) {
        await Promise.all([rm(root, { recursive: true, force: true }), rm(resolveCacheDir(root), { recursive: true, force: true })]).catch(() => {})
      }
      this.#session.active = undefined
      settled.resolve()
    }
  }

  async #generate({ input, root, signal }: { input: GenerateInput; root: string; signal: AbortSignal }): Promise<GenerateResult> {
    const { jobId, config: patch } = input
    // A sandbox has no spec on disk, so it only ever generates from the content Studio sends. A path
    // or URL would make it read host files or fetch internal addresses on behalf of any tenant.
    const studioInput = this.#sandbox ? patch?.input : undefined
    if (this.#sandbox && (typeof studioInput !== 'string' || !studioInput.trim() || getInputKind(studioInput) !== 'inline')) {
      return this.#refuse({ message: 'A sandbox agent generates only from the OpenAPI document content Studio sends, not from a file path or URL' })
    }

    const [config, extensions] = await Promise.all([this.#options.loadConfig(), this.#installedExtensions()])
    const [plugins, adapter, parsers] = await Promise.all([
      mergePlugins({ diskPlugins: config.plugins, studioPlugins: patch?.plugins, extensions }),
      mergeAdapter(config.adapter, patch?.adapter, extensions),
      mergeParsers({ diskParsers: config.parsers, studioParsers: patch?.parsers, extensions }),
    ]).catch(async (error: unknown) => {
      // Thrown before core runs, so nothing else reports it to the host.
      await emit(this.#options.hooks, 'kubb:error', { error: toError(error) })
      throw error
    })

    const activePlugins = plugins ?? config.plugins

    if (patch?.input && !this.#sandbox) {
      // A `kubb:warn` rather than `studio:warn`, so the generation's event stream carries it to Studio too.
      await emit(this.#options.hooks, 'kubb:warn', {
        message: 'Ignored the spec from Studio: generating from a Studio spec is only available to a sandbox agent',
      })
    }

    const hasProjectOnDisk = !this.#sandbox && this.#permissions.allowRead
    const diskFiles = hasProjectOnDisk ? await listDisk({ root, outputPath: config.output.path, maxFiles: DISK_SNAPSHOT_MAX_FILES }) : undefined
    const disk = diskFiles
      ? await this.#generations.keep({ jobId, source: FileSource.DISK, files: diskFiles, maxSetMb: this.#limits.maxSnapshotMb })
      : undefined

    const files = await generate({
      config: {
        ...config,
        root,
        input: studioInput ?? config.input,
        storage: this.#permissions.allowWrite ? fsStorage() : memoryStorage(),
        plugins: activePlugins,
        adapter,
        parsers,
      },
      hooks: this.#options.hooks,
      signal,
      allowExec: this.#permissions.allowExec,
    }).catch(async (error: unknown) => {
      await this.#generations.drop(jobId)
      throw error
    })

    const output = await this.#generations.keep({ jobId, source: FileSource.OUTPUT, files, maxSetMb: this.#limits.maxMb })
    // Only `readInput` reads it, which needs `allowReadAst`.
    const inputBytes = await this.#generations.keepInput({ jobId, input: this.#permissions.allowReadAst ? files.input : null, maxSetMb: this.#limits.maxMb })
    if (!output.paths.length && Object.keys(output.hashes).length) {
      await this.#warn({ message: 'Kept only the hashes of this generation: its output is too large to keep' })
    }
    await this.#generations.add({ jobId, output, disk, inputBytes })
    await this.#logCommand(
      'generate',
      `${activePlugins.length} plugin${activePlugins.length === 1 ? '' : 's'}, ${this.#permissions.allowWrite ? 'written to disk' : 'in memory'}${studioInput !== undefined ? ', from a Studio spec' : ''}`,
    )

    return {
      status: 'success',
      files: [...files.paths],
      fileCount: files.paths.size,
      hashes: output.hashes,
      disk: disk ? { hashes: disk.hashes } : undefined,
    }
  }

  async saveConfig(input: SaveConfigInput): Promise<SaveResult> {
    this.#assertConnected()
    const { configPath, configFile } = this.#options

    if (!Array.isArray(input.edits)) {
      await this.#warn({ message: 'Ignored save: the message carried no edits' })
      return { outcomes: [], changed: false }
    }

    const edits = input.edits
    const refuse = (reason: string): SaveResult => ({ outcomes: edits.map((edit) => ({ edit, applied: false, reason })), changed: false })

    if (!this.#permissions.allowConfigEdit) {
      await this.#warn({ message: 'Ignored save: editing kubb.config.ts was not granted' })
      return refuse('the agent was not granted permission to edit kubb.config.ts')
    }

    // A running generation reloads the config, so it would see half the change.
    if (this.#session.active) return refuse('a generation is in progress')

    try {
      const { outcomes, changed } = await writeConfigEdits({ filePath: configFile, edits, extensions: await this.#installedExtensions() })
      const applied = outcomes.filter((outcome) => outcome.applied).length
      await this.#logCommand('saveConfig', `applied ${applied}/${outcomes.length} edits to ${configPath}`)

      return { outcomes, changed }
    } catch (error) {
      // Refuse every edit so Studio hears back instead of waiting.
      await emit(this.#options.hooks, 'studio:error', { error: toError(error) })
      return refuse(getErrorMessage(error))
    }
  }

  /**
   * Returns the Kubb AST a kept job parsed its spec into. Refused without `allowReadAst`.
   */
  async readInput(input: ReadInputInput): Promise<ReadInputResult> {
    this.#assertConnected()
    if (!this.#permissions.allowReadAst) return this.#refuse({ message: AgentMessage.READ_AST_NOT_ALLOWED, permission: AgentPermission.READ_AST })
    if (typeof input.jobId !== 'string' || !input.jobId) return this.#refuse({ message: 'The request must name a job' })

    const generation = await this.#generations.get(input.jobId)
    if (!generation) return this.#refuse({ message: AgentMessage.GENERATION_GONE })
    // A rerun of the job can leave an earlier run's input on disk, so trust only what this run kept.
    const kept = generation.inputBytes ? await this.#generations.readInput(input.jobId) : undefined
    if (!kept) return this.#refuse({ message: AgentMessage.NO_INPUT })
    await this.#logCommand('readInput', 'read the API input')

    return { input: kept }
  }

  /**
   * Returns the requested files of a kept job, one page of lines at a time. Refused without `allowRead`.
   */
  async readFiles(input: ReadFilesInput): Promise<ReadFilesResult> {
    this.#assertConnected()
    if (!this.#permissions.allowRead) return this.#refuse({ message: AgentMessage.READ_NOT_ALLOWED, permission: AgentPermission.READ })
    if (!Array.isArray(input.paths) || typeof input.jobId !== 'string' || !input.jobId) {
      return this.#refuse({ message: 'The request must name a job and carry paths' })
    }
    const { paths } = input
    if (paths.length > MAX_FILES_PER_REQUEST) return this.#refuse({ message: `At most ${MAX_FILES_PER_REQUEST} paths may be requested at once` })

    const generation = await this.#generations.get(input.jobId)
    if (!generation) return this.#refuse({ message: AgentMessage.GENERATION_GONE })
    if (!isValidPage(input)) return this.#refuse({ message: `The cursor must be a whole line from 0 and come with a limit of 1 to ${MAX_PAGE_LINES} lines` })

    const source = input.source === FileSource.DISK ? FileSource.DISK : FileSource.OUTPUT
    if (!generation[source]) return this.#refuse({ message: 'This agent kept no snapshot of the files on disk for that job' })

    // Only paths the set holds are read, never an arbitrary path.
    const result = await this.#generations.read({ generation, source, paths, cursor: input.cursor, limit: input.limit })
    await this.#logCommand('readFiles', `read ${Object.keys(result.files).length}/${paths.length} requested file${paths.length === 1 ? '' : 's'}`)

    return result
  }

  /**
   * Returns one page of the line diff of a file between two kept sets. Refused without `allowRead`.
   */
  async readDiff(input: ReadDiffInput): Promise<ReadDiffResult> {
    this.#assertConnected()
    if (!this.#permissions.allowRead) return this.#refuse({ message: AgentMessage.READ_NOT_ALLOWED, permission: AgentPermission.READ })
    const { jobId, path, base, cursor = 0, limit } = input
    if (typeof jobId !== 'string' || !jobId || typeof path !== 'string' || !path || typeof base?.jobId !== 'string' || !base.jobId) {
      return this.#refuse({ message: 'The request must name a job, a base, and a path' })
    }
    if (!isValidPage({ cursor, limit })) {
      return this.#refuse({ message: `The cursor must be a whole line from 0 and come with a limit of 1 to ${MAX_PAGE_LINES} lines` })
    }

    const [generation, baseGeneration] = await Promise.all([this.#generations.get(jobId), this.#generations.get(base.jobId)])
    if (!generation || !baseGeneration) return this.#refuse({ message: AgentMessage.GENERATION_GONE })
    const baseSource = base.source === FileSource.DISK ? FileSource.DISK : FileSource.OUTPUT
    if (!baseGeneration[baseSource]) return this.#refuse({ message: 'This agent kept no snapshot of the files on disk for that job' })

    // Only paths the sets hold are read, never an arbitrary path.
    const [after, before] = await Promise.all([
      this.#generations.read({ generation, source: FileSource.OUTPUT, paths: [path] }),
      this.#generations.read({ generation: baseGeneration, source: baseSource, paths: [path] }),
    ])
    const afterContent = after.files[path]
    // Over the size cap only hashes are kept, which must not read as a deleted file.
    if (afterContent === undefined && path in generation.output.hashes) return this.#refuse({ message: 'This agent kept only the hashes of that job' })
    const beforeContent = before.files[path]
    if (beforeContent === undefined) return { hunks: [], nextCursor: null, hasBase: false }

    const key = JSON.stringify([jobId, base.jobId, baseSource, path])
    let all = this.#diffs.get(key)
    if (!all) {
      all = diffHunks(beforeContent, afterContent ?? '')
      this.#diffs.set(key, all)
      // A few recent diffs cover paging through the open file and switching back to the last one.
      if (this.#diffs.size > 4) this.#diffs.delete(this.#diffs.keys().next().value!)
    }
    await this.#logCommand('readDiff', `read the diff of ${path}`)

    return { ...pageHunks({ hunks: all, cursor, limit }), hasBase: true }
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
  // Captured and aborted before the warning, so a slow listener neither keeps the run going nor
  // sees it finish and clear `session.active` first.
  const active = session.active
  if (active) {
    active.abort()
    await emit(hooks, 'studio:warn', { message: 'Canceled the running generation: the connection to Kubb Studio closed' })
  }
  await active?.settled

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
    permissions: { allowWrite: false, allowConfigEdit: false, allowExec: false, allowRead: false, allowReadAst: false, ...options.permissions },
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
