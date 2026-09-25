import { randomUUID } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { getErrorMessage, read, toError } from '@internals/utils'
import { cacheStorage, type Config, fsStorage, Hookable, type KubbHooks, memoryStorage, resolveCacheDir } from '@kubb/core'
import { version as kubbVersion } from '../package.json'
import { setupHookListener } from './hooks.ts'
import {
  type AgentApi,
  type AgentCapacity,
  type AgentRegisterResponse,
  type AgentLoad,
  type AgentPermissions,
  type ConfigFileView,
  type ConnectMessagePayload,
  type GenerateInput,
  type GenerateResult,
  type GenerationEvent,
  type GenerationRun,
  GENERATION_GONE_MESSAGE,
  MAX_FILES_PER_REQUEST,
  type ReadFilesInput,
  type SaveConfigInput,
  type SaveResult,
  type PublishSnapshotInput,
  type PublishSnapshotResult,
  AgentCloseCode,
  type RpcClose,
  type RpcConnector,
  type RpcConnection,
} from './protocol/index.ts'
import { IncompatibleAgentError, InvalidAgentTokenError, registerAgent } from './api.ts'
import { applyConfigEdits, readConfig } from './configFile.ts'
import { generate } from './generate.ts'
import { agentDefaults, resolveAgentCapacity, resolveGenerationLimits } from './constants.ts'
import { mergeAdapter, mergePlugins, toPackageName } from './resolveConfig.ts'
import { createSnapshotPackage } from './snapshotPackage.ts'
import { RpcTarget } from 'capnweb'
import { createGenerationStore, type GenerationStore, listDisk } from './generations.ts'
import { createGenerationStream, type GenerationEnd } from './ws.ts'
import { connectWebSocketRpc } from './rpc.ts'

/**
 * Past this many files in the output directory, no snapshot of it is taken before a run.
 */
const DISK_SNAPSHOT_MAX_FILES = 10_000

/**
 * How long a sandbox keeps a generation readable. Its store is in memory and holds every tenant's
 * runs, so an old one has to go even when count and size leave room. A local agent keeps its runs
 * until count or size pushes them out, so a later run can still diff against the one before it.
 */
const SANDBOX_GENERATION_TTL_MS = 15 * 60_000

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

class GenerationRunTarget extends RpcTarget implements GenerationRun {
  constructor(
    private readonly generationStream: ReadableStream<GenerationEvent>,
    private readonly generationResult: Promise<GenerateResult>,
    private readonly cancelGeneration: () => Promise<void>,
    /** Stops the run. Cap'n Web calls this on explicit disposal and on a dropped session alike. */
    private readonly stopGeneration: () => void,
  ) {
    super()
  }

  async events() {
    return this.generationStream
  }
  result() {
    return this.generationResult
  }
  cancel() {
    return this.cancelGeneration()
  }
  [Symbol.dispose]() {
    this.stopGeneration()
  }
}

export type StudioSessionOptions = {
  connector?: RpcConnector
  token: string
  studioUrl?: string
  configPath: string
  /**
   * Loads the on-disk Kubb config. Injected so each host resolves config its own way: the Docker
   * agent from an explicit `KUBB_AGENT_CONFIG` path, the CLI through the same discovery
   * `kubb generate` uses.
   */
  loadConfig: () => Promise<Config>
  /**
   * The runtime's own version, reported to Studio next to the `kubb` version.
   */
  version: string
  /**
   * What Studio may do in this project, off unless the host grants it. A sandbox session narrows
   * them further: it never writes to disk and never edits a config file, and it always generates
   * from the spec Studio sends.
   */
  permissions?: Partial<AgentPermissions>
  root?: string
  /**
   * Maximum reconnect backoff in milliseconds.
   */
  retryInterval?: number
  /**
   * Number of consecutive reconnect attempts that already failed.
   */
  reconnectAttempt?: number
  /**
   * Milliseconds between keep-alive pings, clamped to `agentDefaults.maxHeartbeatIntervalMs`.
   * Raise it to halve the traffic and database writes a long-lived agent costs, at the price of
   * Studio taking that much longer to notice the agent has gone. Lower it in development to see
   * connection state move immediately.
   */
  heartbeatInterval?: number
  /**
   * What this agent process can take on, reported to Studio at registration. Unset fields come from
   * `KUBB_AGENT_MAX_CONCURRENT`.
   */
  capacity?: Partial<AgentCapacity>
  /**
   * Names this agent process to Studio, sent at registration and as {@link AGENT_INSTANCE_HEADER}
   * on the socket. `createClient` sets one per process, so a reconnect is the same instance and a
   * restart is a new one. Not meant to be set directly by a host.
   */
  instanceId?: string
  /**
   * Aborting this disconnects the session and stops the reconnect loop. Hosts wire it to their own
   * shutdown: Nitro's `close` hook, or `SIGINT`/`SIGTERM` in the CLI.
   */
  signal?: AbortSignal
  /**
   * Installs listeners on the session's event emitter, which carries both the session events and
   * the generations it runs. Left out, the runtime prints nothing, which is what a library should
   * default to.
   */
  installLogger?: (hooks: Hookable<KubbHooks>) => void | Promise<void>
  /**
   * Called when this session's background reconnect is rejected with an invalid token. Unlike
   * `ClientOptions.onAuthRequired`, this fires once per session rather than once per pool:
   * `createClient` wraps it into that deduped, pool-stopping callback. Not meant to be set
   * directly by a host.
   */
  onTokenRejected?: (error: InvalidAgentTokenError) => void
}

/**
 * A session's options with every default filled in, so nothing downstream repeats a fallback.
 */
type ResolvedOptions = StudioSessionOptions & {
  studioUrl: string
  root: string
  permissions: AgentPermissions
  retryInterval: number
  heartbeatInterval: number
  capacity: AgentCapacity
  instanceId: string
  /**
   * Absolute path to the config file, for reading and patching it. `configPath` keeps the form the
   * host gave, which is what Studio shows.
   */
  configFile: string
}

/**
 * Fills in a host's options: the hosted Studio URL, the current working directory, and every
 * permission off unless granted. Idempotent, so a reconnect can pass an already-resolved bag
 * back in.
 */
function applyStudioDefaults(options: StudioSessionOptions): ResolvedOptions {
  const root = options.root ?? process.cwd()

  return {
    ...options,
    studioUrl: options.studioUrl ?? agentDefaults.studioUrl,
    root,
    // `configPath` is relative to the agent's root unless it is already absolute, which is what
    // `resolve` does on its own.
    configFile: path.resolve(root, options.configPath),
    permissions: { allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false, allowRead: false, ...options.permissions },
    retryInterval: options.retryInterval ?? agentDefaults.retryIntervalMs,
    // Studio counts an agent offline once its last ping is older than its liveness window, so a
    // slower cadence would make a healthy agent invisible. Clamped here rather than in a host's
    // env parsing, so every host is held to the contract.
    heartbeatInterval: Math.min(options.heartbeatInterval ?? agentDefaults.heartbeatIntervalMs, agentDefaults.maxHeartbeatIntervalMs),
    capacity: { ...resolveAgentCapacity(), ...options.capacity },
    instanceId: options.instanceId ?? randomUUID(),
  }
}

/**
 * Jobs one agent process can run at once today. Two runs would share this session's hook emitter,
 * and with it each other's events, until each job runs in its own worker (ADR-0003 slice B2).
 */
const RUNTIME_MAX_CONCURRENT = 1

const MB = 1024 * 1024

function rssMb(): number {
  return process.memoryUsage().rss / MB
}

function backoffDelayMs(attempt: number, maxMs: number): number {
  const cap = Math.min(1_000 * 2 ** (attempt - 1), maxMs)
  return Math.random() * cap
}

function reconnect(options: ResolvedOptions, delayMs: number, attempt: number): void {
  const { signal, onTokenRejected } = options

  if (signal?.aborted) {
    return
  }

  const cancel = () => clearTimeout(timer)
  const timer = setTimeout(() => {
    // Removed here rather than left to `{ once: true }`: the signal only aborts at shutdown, so one
    // listener per retry would accumulate for the whole life of a down-Studio retry loop.
    signal?.removeEventListener('abort', cancel)

    if (signal?.aborted) {
      return
    }

    // The rejection is never awaited, so it has to be caught here or it surfaces as an
    // unhandledRejection that kills the retry loop instead of trying again. The failure itself was
    // already reported: `start()` sends `studio:error` through the new session's hooks.
    new StudioSession({ ...options, reconnectAttempt: attempt }).start().catch((error: unknown) => {
      // A rejected token stays rejected, so retrying only spams 401s until the process is killed.
      // The host learns about it here instead: the startup path already reports its own rejection
      // by throwing, so only the background path needs the callback.
      if (error instanceof InvalidAgentTokenError) {
        onTokenRejected?.(error)

        return
      }

      // An agent too old for Studio stays too old; `start()` already reported it.
      if (error instanceof IncompatibleAgentError) return

      const nextAttempt = attempt + 1
      reconnect(options, backoffDelayMs(nextAttempt, options.retryInterval), nextAttempt)
    })
  }, delayMs)

  signal?.addEventListener('abort', cancel, { once: true })
}

/**
 * How a session ends: what the host is told, and whether it reconnects.
 */
type EndPlan = {
  reason: string
  retry: boolean
  /** Reported through `studio:error` when the end needs the user to act. */
  error?: Error
}

/**
 * Reads what Studio meant by closing the connection. A code Studio did not send on purpose is an
 * ordinary drop, and the agent reconnects as it always has.
 */
function planEnd(close: RpcClose | void): EndPlan {
  const code = close?.code
  // Every connection attempt registers first, so reconnecting is how the agent registers again.
  if (code === AgentCloseCode.REAUTHENTICATE) return { reason: 'Kubb Studio asked the agent to register again', retry: true }
  if (code === AgentCloseCode.SUPERSEDED) return { reason: 'another instance of this agent took over', retry: false }
  if (code === AgentCloseCode.INCOMPATIBLE) {
    return {
      reason: 'this agent is too old for Kubb Studio, or was deleted',
      retry: false,
      error: new Error('Kubb Studio closed the connection: this agent is too old for it, or was deleted. Upgrade the agent, or pair it again.'),
    }
  }
  return { reason: 'connection closed', retry: true }
}

/**
 * One agent-to-Studio RPC transport: opening it, keeping it alive, and serving remote methods.
 * `createClient` opens one per pool slot and is the only caller.
 */
export class StudioSession implements AgentApi {
  readonly #options: ResolvedOptions
  // Each session gets its own isolated event emitter so generation events from one session do not
  // bleed into another session's WebSocket stream.
  readonly #hooks = new Hookable<KubbHooks>()
  /**
   * Removers for every listener this session added (socket, shutdown signal, hooks) so `dispose`
   * detaches them in one pass. Listeners a host attached itself through `installLogger` survive.
   */
  readonly #unhooks: Array<() => void> = []

  /**
   * What registration handed back, and the marker for whether the agent registered at all.
   * Before it resolves there is no sandbox flag to read.
   */
  #registration: AgentRegisterResponse | undefined
  #rpc: RpcConnection | undefined
  // Returned with the session, so both sides can be named from the first RPC connection.
  #studioVersion: string | undefined

  // Whether the session is over: guards the close event from tearing down twice, and a shutdown
  // from being turned into a reconnect.
  #disposed = false
  // Guards against a second `generate` command starting while one is already running. Without
  // this, two concurrent `generate()` calls share this socket via `setupEventsStream`, and their
  // events interleave with no way for Studio to tell the two runs apart.
  #isGenerating = false
  #activeJob: { jobId: string; cancel: () => Promise<void> } | undefined
  #heartbeatTimer: ReturnType<typeof setTimeout> | undefined
  // Set by `kubb:generation:end`, filed into `#generations` once the job finishes.
  #lastGeneration: GenerationEnd | undefined
  #store: GenerationStore | undefined
  readonly #limits = resolveGenerationLimits()
  /**
   * Resolves when Studio calls {@link StudioSession.connect}. `studio:ready` waits on this so the
   * host does not queue jobs before the agent session is registered.
   */
  readonly #connectAck = Promise.withResolvers<void>()
  #reconnectAttempt: number

  constructor({ reconnectAttempt, ...options }: StudioSessionOptions) {
    this.#options = applyStudioDefaults(options)
    this.#reconnectAttempt = reconnectAttempt ?? 0
    // dispose() may reject this before start() awaits it
    void this.#connectAck.promise.catch(() => {})
  }

  /**
   * A sandbox agent runs on Studio's own infrastructure, so it has no user project to touch.
   */
  get #isSandbox(): boolean {
    return this.#registration?.isSandbox === true
  }

  /**
   * Kept in the project's cache directory, so it survives a restart, except on a sandbox: its pool
   * sessions run every tenant's jobs, so it keeps them in memory. Looked up by job id only.
   */
  get #generations(): GenerationStore {
    this.#store ??= createGenerationStore({
      storage: this.#isSandbox ? memoryStorage() : cacheStorage({ root: this.#options.root }),
      maxCount: this.#limits.maxCount,
      maxMb: this.#limits.maxMb,
      ttlMs: this.#isSandbox ? SANDBOX_GENERATION_TTL_MS : undefined,
    })
    return this.#store
  }

  get #canWrite(): boolean {
    return !this.#isSandbox && this.#options.permissions.allowWrite
  }

  get #canEditConfig(): boolean {
    return !this.#isSandbox && this.#options.permissions.allowConfigEdit
  }

  /**
   * A sandbox agent always generates from the spec Studio supplies. A local agent only when the
   * host opted in.
   */
  get #canUseInput(): boolean {
    return this.#isSandbox || this.#options.permissions.allowInput
  }

  /**
   * A sandbox agent always allows reading its output back; a local agent only when opted in.
   */
  get #canRead(): boolean {
    return this.#isSandbox || this.#options.permissions.allowRead
  }

  async start(): Promise<void> {
    const { token, studioUrl, signal, heartbeatInterval, installLogger, instanceId, capacity } = this.#options

    await installLogger?.(this.#hooks)

    try {
      // Before registering, so a host can cover the wait: registration is a round trip and the
      // socket after it opens without being awaited.
      await this.#hooks.callHook('studio:connecting', { url: studioUrl })

      if (this.#reconnectAttempt === 0 && capacity.maxConcurrent > RUNTIME_MAX_CONCURRENT) {
        await this.#warn(
          `Running ${RUNTIME_MAX_CONCURRENT} job at a time: KUBB_AGENT_MAX_CONCURRENT=${capacity.maxConcurrent} needs per-job workers, which this agent does not have yet`,
        )
      }

      const registration = await registerAgent({
        token,
        studioUrl,
        instanceId,
        capacity: { ...capacity, maxConcurrent: Math.min(capacity.maxConcurrent, RUNTIME_MAX_CONCURRENT) },
      })

      this.#registration = registration
      this.#studioVersion = registration.version

      const rpc = await (this.#options.connector ?? connectWebSocketRpc)({ url: registration.socketUrl, token, instanceId, local: this })
      this.#rpc = rpc
      void rpc.closed.then(this.#onClose)

      signal?.addEventListener('abort', this.#onAbort, { once: true })
      this.#unhooks.push(() => signal?.removeEventListener('abort', this.#onAbort))

      this.#scheduleHeartbeat(heartbeatInterval)
      await this.#hooks.callHook('studio:connected', {
        url: studioUrl,
        versions: { studio: this.#studioVersion, kubb: kubbVersion, agent: this.#options.version },
        agentSlug: registration.agentSlug,
        organizationSlug: registration.organizationSlug,
      })
      // Studio registers the agent by calling connect() over RPC. Ready means that handshake landed.
      await this.#connectAck.promise
      this.#reconnectAttempt = 0
      await this.#hooks.callHook('studio:ready', {})
    } catch (error) {
      // A connector can fail after opening RPC and installing the heartbeat. Tear down every
      // partial resource before retrying, otherwise each retry leaks a timer and a live session.
      this.#disposed = true
      this.dispose()
      await this.#hooks.callHook('studio:error', { error: toError(error) })

      if (error instanceof InvalidAgentTokenError || error instanceof IncompatibleAgentError) {
        throw error
      }

      await this.#reconnect()
    }
  }

  /**
   * Tells the host a retry is coming, then schedules it. The host prints the retry, since the
   * runtime has no output of its own.
   */
  async #reconnect(): Promise<void> {
    if (this.#options.signal?.aborted) {
      return
    }

    const attempt = this.#reconnectAttempt + 1
    const delayMs = backoffDelayMs(attempt, this.#options.retryInterval)
    await this.#hooks.callHook('studio:reconnecting', { delayMs })
    reconnect(this.#options, delayMs, attempt)
  }

  #warn(message: string, permission?: keyof AgentPermissions): Promise<void> | void {
    return this.#hooks.callHook('studio:warn', { message, permission })
  }

  /**
   * Declines a request: logs why locally, then tells Studio. The two wordings differ on purpose,
   * since the log names the request that was ignored and the error names what the caller can do.
   */
  async #refuse(reason: string, message: string, permission?: keyof AgentPermissions): Promise<never> {
    await this.#warn(reason, permission)
    throw new Error(message)
  }

  #scheduleHeartbeat(interval: number): void {
    const rpc = this.#rpc
    if (!rpc) {
      return
    }
    this.#heartbeatTimer = setTimeout(async () => {
      try {
        await this.#ping(rpc)
      } catch {
        if (this.#rpc === rpc) {
          rpc.close()
        }
        return
      }

      if (this.#rpc === rpc) {
        this.#scheduleHeartbeat(interval)
      }
    }, interval)
  }

  /**
   * Races `studio.ping()` against a deadline, so a half-open socket can't hang it forever.
   * */
  async #ping(rpc: RpcConnection): Promise<void> {
    const { promise: timedOut, reject: onTimeout } = Promise.withResolvers<never>()
    const timer = setTimeout(() => onTimeout(new Error('Heartbeat ping timed out')), agentDefaults.heartbeatTimeoutMs)

    try {
      // A load report that fails to build must not cost the heartbeat itself.
      const load = await Promise.race([this.#load().catch(() => undefined), timedOut])
      await Promise.race([rpc.studio.ping(load), timedOut])
    } finally {
      clearTimeout(timer)
    }
  }

  async #load(): Promise<AgentLoad> {
    return {
      running: this.#isGenerating ? 1 : 0,
      rssMb: Math.round(rssMb()),
      storeBytes: await this.#generations.bytes(),
      accepting: true,
    }
  }

  /**
   * Reads `kubb.config.ts` and reports which plugin options Studio may edit.
   *
   * Skipped when the host did not grant `allowConfigEdit`. Not cached: the user can edit the file
   * between two Studio actions.
   */
  async #readConfigFileView(source?: string): Promise<ConfigFileView | undefined> {
    if (!this.#canEditConfig) {
      return undefined
    }

    try {
      return readConfig(source ?? (await read(this.#options.configFile)))
    } catch (error) {
      await this.#warn(`Could not read ${this.#options.configFile}: ${getErrorMessage(error)}`)

      return undefined
    }
  }

  async connect(): Promise<ConnectMessagePayload> {
    const { configPath, root, version, loadConfig, permissions } = this.#options
    const [config, file] = await Promise.all([loadConfig(), this.#readConfigFileView()])

    const payload: ConnectMessagePayload = {
      versions: { kubb: kubbVersion, agent: version },
      root,
      config: {
        path: configPath,
        file,
        plugins: config.plugins.map((plugin) => ({
          name: toPackageName(plugin.name),
          options: plugin.options ?? {},
        })),
      },
      permissions: {
        ...permissions,
        allowWrite: this.#canWrite,
        allowInput: this.#canUseInput,
        allowConfigEdit: this.#canEditConfig,
        allowRead: this.#canRead,
      },
    }
    this.#connectAck.resolve()
    return payload
  }

  #onAbort = (): void => void this.#end({ reason: 'shutdown', retry: false })

  #onClose = (close: RpcClose | void): void => void this.#end(planEnd(close))

  /**
   * Drops the socket and detaches every listener and timer this session added. Idempotent, and
   * safe before `connect` opened anything.
   *
   * @internal
   */
  dispose(): void {
    clearTimeout(this.#heartbeatTimer)
    this.#heartbeatTimer = undefined
    this.#rpc?.close()
    this.#rpc = undefined
    this.#connectAck.reject(new Error('Session ended before Studio called connect()'))

    for (const unhook of this.#unhooks) unhook()
    this.#unhooks.length = 0
  }

  /**
   * Ends the session: tells Studio it is over, drops the socket, and optionally reconnects.
   * `#disposed` keeps the close event from running this twice, and a shutdown from reconnecting.
   */
  async #end({ reason, retry, error }: EndPlan): Promise<void> {
    if (this.#disposed) {
      return
    }
    this.#disposed = true

    this.dispose()

    await this.#hooks.callHook('studio:disconnected', { reason })

    if (error) {
      await this.#hooks.callHook('studio:error', { error })
    }

    // The closed socket is the whole notice: Studio drops the agent's connection the moment it sees it.
    if (retry) {
      await this.#reconnect()
    }
  }

  startGeneration(data: GenerateInput): GenerationRun {
    const generationStream = createGenerationStream(this.#hooks, data.jobId, {
      onGenerationEnd: (result) => {
        this.#lastGeneration = result
      },
    })
    const controller = new AbortController()
    const cancelRun = async () => {
      controller.abort(new Error('Generation canceled'))
    }
    const result = this.#runGeneration(data, controller, cancelRun)
      .then(async (value) => {
        await generationStream.close()
        return value
      })
      .catch((error) => {
        generationStream.fail(error)
        throw error
      })
      .finally(() => {
        if (this.#activeJob?.cancel === cancelRun) this.#activeJob = undefined
      })
    // A dispose can reject this with nobody holding it, which would otherwise be unhandled.
    void result.catch(() => {})

    return new GenerationRunTarget(generationStream.stream, result, cancelRun, () => {
      controller.abort(new Error('Generation canceled'))
      generationStream.dispose()
    })
  }

  /**
   * Cancels the currently running job when its id matches `jobId`.
   */
  async cancel(jobId: string): Promise<void> {
    if (this.#activeJob?.jobId === jobId) await this.#activeJob.cancel()
  }

  async #runGeneration(data: GenerateInput, controller: AbortController, cancelRun: () => Promise<void>): Promise<GenerateResult> {
    // Checked before the first `await`, so two calls in the same tick can't both pass.
    if (this.#isGenerating) {
      return this.#refuse('Ignored generate: a generation is already in progress', 'A generation is already in progress, please wait for it to finish')
    }
    this.#isGenerating = true
    this.#activeJob = { jobId: data.jobId, cancel: cancelRun }

    const command = 'generate'
    const { loadConfig, permissions } = this.#options
    let root = this.#options.root

    try {
      if (this.#isSandbox) root = await createJobRoot()
      await this.#hooks.callHook('studio:command:start', { command })
      const config = await loadConfig()
      const patch = data.config
      const plugins = await mergePlugins(config.plugins, patch?.plugins)
      const adapter = await mergeAdapter(config.adapter, patch?.adapter)

      // A sandbox agent always uses the inline spec (empty string included, since it has no disk
      // file); a local agent only when opted in, and an empty or absent spec falls back to disk.
      const inputOverride = this.#isSandbox ? (patch?.input ?? '') : (permissions.allowInput && patch?.input) || undefined

      if (permissions.allowWrite && this.#isSandbox) {
        await this.#warn('Running in a sandbox, so writing files is disabled')
      }

      if (patch?.input && !this.#canUseInput) {
        await this.#warn('Ignored the spec from Studio: generating from a Studio spec was not granted', 'allowInput')
      }

      const resolvedPlugins = plugins ?? config.plugins

      // The session's own emitter carries the run: the host's logger is already on it from
      // `connect`, and these two come off again below, so one run's listeners never see the next.
      // Cleared up front, filled the moment `kubb:generation:end` fires.
      this.#lastGeneration = undefined
      const diskFiles = this.#hasProjectOnDisk ? await listDisk({ root, outputPath: config.output.path, maxFiles: DISK_SNAPSHOT_MAX_FILES }) : undefined
      const disk = diskFiles
        ? await this.#generations.keep({ jobId: data.jobId, source: 'disk', files: diskFiles, maxSetMb: this.#limits.maxSnapshotMb })
        : undefined
      const detach = [setupHookListener(this.#hooks, root, controller.signal)]

      try {
        await generate({
          config: {
            ...config,
            root,
            input: inputOverride ?? config.input,
            storage: this.#canWrite ? fsStorage() : memoryStorage(),
            output: permissions.allowExec ? { ...config.output } : { ...config.output, format: false, lint: false, postGenerate: [] },
            plugins: resolvedPlugins,
            adapter,
          },
          hooks: this.#hooks,
          signal: controller.signal,
        })
      } catch (error) {
        await this.#generations.drop(data.jobId)
        throw error
      } finally {
        for (const remove of detach) remove()
      }

      await this.#hooks.callHook('studio:command:end', {
        command,
        info: `${resolvedPlugins.length} plugin${resolvedPlugins.length === 1 ? '' : 's'}, ${this.#canWrite ? 'written to disk' : 'in memory'}${inputOverride !== undefined ? ', from a Studio spec' : ''}`,
      })

      // The generate call above reassigns the field, but control flow analysis still sees the
      // `= undefined` from this method and narrows it to `never`.
      const generation = this.#lastGeneration as GenerationEnd | undefined
      const output = generation
        ? await this.#generations.keep({ jobId: data.jobId, source: 'output', files: generation.output, maxSetMb: this.#limits.maxMb })
        : undefined
      if (generation && output) {
        if (!output.paths.length && Object.keys(output.hashes).length) {
          await this.#warn('Kept only the hashes of this generation: its output is too large to keep')
        }
        const { peerDependencies, missingDependencies } = generation
        await this.#generations.add({ jobId: data.jobId, output, disk, peerDependencies, missingDependencies })
      }
      const files = [...(generation?.output.paths ?? [])]
      return {
        status: 'success',
        files,
        fileCount: files.length,
        hashes: output?.hashes ?? {},
        disk: disk ? { hashes: disk.hashes } : undefined,
      }
    } finally {
      if (root !== this.#options.root) await removeJobRoot(root)
      this.#isGenerating = false
    }
  }

  async saveConfig(data: SaveConfigInput): Promise<SaveResult> {
    const command = 'saveConfig'
    await this.#hooks.callHook('studio:command:start', { command })
    const { configPath, configFile } = this.#options

    // Every RPC call gets one result. `edits` is checked before it is walked because values cross
    // the agent trust boundary.
    if (!Array.isArray(data.edits)) {
      await this.#warn('Ignored save: the message carried no edits')

      return { outcomes: [], changed: false }
    }

    const edits = data.edits
    const refuse = (reason: string): SaveResult => ({ outcomes: edits.map((edit) => ({ edit, applied: false, reason })), changed: false })

    if (!this.#canEditConfig) {
      await this.#warn('Ignored save: editing kubb.config.ts was not granted')

      return refuse('the agent was not granted permission to edit kubb.config.ts')
    }

    // A generation reloads the config while it runs, so rewriting the file underneath it would
    // leave that run working from half the change.
    if (this.#isGenerating) {
      return refuse('a generation is in progress')
    }

    try {
      // Read straight before the patch rather than reusing what went out on connect. The user may
      // have edited the file since, and since every untouched node keeps its own text, patching
      // what is on disk right now preserves that edit.
      const current = await read(configFile)
      const { source: patched, outcomes, changed } = applyConfigEdits(current, edits)

      if (changed) {
        // `writeFile` rather than the `write` helper: that one trims and re-terminates what it
        // writes, which is right for generated output and wrong for a file the user wrote by hand.
        await writeFile(configFile, patched, 'utf-8')
      }

      const applied = outcomes.filter((outcome) => outcome.applied).length
      await this.#hooks.callHook('studio:command:end', { command, info: `applied ${applied}/${outcomes.length} edits to ${configPath}` })
      return { outcomes, changed, file: changed ? await this.#readConfigFileView(patched) : undefined }
    } catch (error) {
      // An unreadable config, a read-only filesystem. Reported as a refusal of every edit so
      // Studio hears back rather than waiting on a reply that never comes.
      await this.#hooks.callHook('studio:error', { error: toError(error) })

      return refuse(getErrorMessage(error))
    }
  }

  async publishSnapshot(data: PublishSnapshotInput): Promise<PublishSnapshotResult> {
    const command = 'snapshot'
    await this.#hooks.callHook('studio:command:start', { command })

    if (this.#isSandbox) {
      return this.#refuse('Ignored snapshot: a sandbox agent has no project to build a package from', 'A sandbox agent has no project to build a package from')
    }

    const { name, version, bundledDependencies, uploadPath } = data

    if (!name || !version || !uploadPath) {
      return this.#refuse('Ignored snapshot: the message was missing required fields', 'The request was missing required fields')
    }

    const generation = await this.#generations.latest()

    if (!generation) {
      return this.#refuse('Ignored snapshot: no prior generation to pack', 'No prior generation exists to pack, run a generation first')
    }

    const bundled = new Set(bundledDependencies ?? [])
    const missing = generation.missingDependencies.filter((dependency) => !bundled.has(dependency))

    if (missing.length) {
      return this.#refuse(`Ignored snapshot: missing dependencies: ${missing.join(', ')}`, `Missing dependencies: ${missing.join(', ')}`)
    }

    try {
      const files = await this.#generations.read({ generation, source: 'output', paths: generation.output.paths })

      const { bytes, integrity } = await createSnapshotPackage(files, { name, version, peerDependencies: generation.peerDependencies })

      // The tarball can't go on this request: Studio's handler answers before reading the body,
      // so the connection drops mid-upload. Ask for the redirect with an empty body first, then
      // PUT the bytes to wherever it points. That also keeps the bearer token off the storage
      // request, since it's a fresh call rather than a followed redirect.
      const { token, studioUrl } = this.#options
      const uploadUrl = new URL(uploadPath, studioUrl)
      if (uploadUrl.origin !== new URL(studioUrl).origin) {
        throw new Error('Snapshot upload path must stay on the Studio origin')
      }
      const redirect = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'manual',
      })
      const storageUrl = redirect.headers.get('location')
      if (redirect.status !== 307 || !storageUrl) {
        throw new Error(`Studio did not provide a storage URL (status ${redirect.status})`)
      }
      const storage = new URL(storageUrl)
      if (storage.protocol !== 'https:' && storage.hostname !== 'localhost' && storage.hostname !== '127.0.0.1') {
        throw new Error(`Refusing snapshot upload to ${storage.origin}`)
      }
      const response = await fetch(storage, { method: 'PUT', body: new Uint8Array(bytes), redirect: 'error' })
      if (!response.ok) {
        throw new Error(`Snapshot upload failed with status ${response.status}`)
      }

      await this.#hooks.callHook('studio:command:end', {
        command,
        info: `packed ${Object.keys(files).length} file${Object.keys(files).length === 1 ? '' : 's'}`,
      })
      return { integrity, peerDependencies: generation.peerDependencies }
    } catch (error) {
      await this.#hooks.callHook('studio:error', { error: toError(error) })
      throw error
    }
  }

  /**
   * An agent with a project on disk can show a run against what its output directory held before.
   * A sandbox agent has no project.
   */
  get #hasProjectOnDisk(): boolean {
    return !this.#isSandbox && this.#canRead
  }

  async readFiles(data: ReadFilesInput): Promise<{ files: Record<string, string> }> {
    const command = 'readFiles'
    await this.#hooks.callHook('studio:command:start', { command })

    if (!this.#canRead) {
      return this.#refuse('Ignored files: reading generated files was not granted', 'The agent was not granted permission to read generated files', 'allowRead')
    }

    // `paths` came off the wire, so check its shape before walking it.
    if (!Array.isArray(data.paths)) {
      return this.#refuse('Ignored files: the message carried no paths', 'The request carried no paths')
    }

    const { paths } = data

    if (paths.length > MAX_FILES_PER_REQUEST) {
      return this.#refuse(
        `Ignored files: requested ${paths.length} paths, more than the ${MAX_FILES_PER_REQUEST} allowed per request`,
        `At most ${MAX_FILES_PER_REQUEST} paths may be requested at once`,
      )
    }

    if (typeof data.jobId !== 'string' || !data.jobId) {
      return this.#refuse('Ignored files: the message named no job', 'The request named no generation job')
    }

    const generation = await this.#generations.get(data.jobId)

    if (!generation) {
      return this.#refuse(`Ignored files: job ${data.jobId} is not kept on this agent`, GENERATION_GONE_MESSAGE)
    }

    const source = data.source === 'disk' ? 'disk' : 'output'

    if (!generation[source]) {
      return this.#refuse('Ignored files: that job has no snapshot of the files on disk', 'This agent kept no snapshot of the files on disk for that job')
    }

    // Only paths the set holds are read, never an arbitrary path.
    const files = await this.#generations.read({ generation, source, paths })

    await this.#hooks.callHook('studio:command:end', {
      command,
      info: `read ${Object.keys(files).length}/${paths.length} requested file${paths.length === 1 ? '' : 's'}`,
    })
    return { files }
  }
}
