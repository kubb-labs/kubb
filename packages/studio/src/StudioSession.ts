import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage, inParallel, read, toError } from '@internals/utils'
import { type Config, fsStorage, Hookable, type KubbHooks, logLevel as logLevelMap, memoryStorage, type Storage } from '@kubb/core'
import { version as kubbVersion } from '../package.json'
import { setupHookListener } from './hooks.ts'
import {
  type AgentConnectResponse,
  type AgentMessage,
  type AgentPermissions,
  type ClientInfo,
  type ConfigFileView,
  isCommandMessage,
  isDisconnectMessage,
  isStudioPongMessage,
  isStudioReadyMessage,
  MAX_FILES_PER_REQUEST,
} from './protocol/index.ts'
import { createAgentSession, disconnect, InvalidAgentTokenError } from './api.ts'
import { applyConfigEdits, readConfig } from './configFile.ts'
import { generate } from './generate.ts'
import { agentDefaults } from './constants.ts'
import { mergeAdapter, mergePlugins, toPackageName } from './resolveConfig.ts'
import { createSnapshotPackage } from './snapshotPackage.ts'
import type WebSocket from 'ws'
import { absoluteStoragePath, createWebsocket, sendAgentMessage, sendErrorMessage, setupEventsStream } from './ws.ts'

/**
 * How many files are read from storage at once when serving `studio:files` or packing a
 * `studio:snapshot`.
 */
const FILE_READ_CONCURRENCY = 50

export type StudioSessionOptions = {
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
   * Identifies the host to Studio, so the UI can badge a CLI connection and show the real project.
   */
  client?: ClientInfo
  /**
   * What Studio may do in this project, off unless the host grants it. A sandbox session narrows
   * them further: it never writes to disk and never edits a config file, and it always generates
   * from the spec Studio sends.
   */
  permissions?: Partial<AgentPermissions>
  root?: string
  retryInterval?: number
  /**
   * Milliseconds between keep-alive pings, clamped to `agentDefaults.maxHeartbeatIntervalMs`.
   * Raise it to halve the traffic and database writes a long-lived agent costs, at the price of
   * Studio taking that much longer to notice the agent has gone. Lower it in development to see
   * connection state move immediately.
   */
  heartbeatInterval?: number
  /**
   * Number of pool sessions this agent serves. Read by `createClient`, which opens one
   * session per slot, and reported to Studio at registration.
   */
  poolSize?: number
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
   * Threshold for the reconnect loop's own `console.error` lines, using the numeric constants
   * `@kubb/core` exports as `logLevel`. Left out, those lines never print, the same silent default
   * as an unset `installLogger` — a reconnect happens outside any one session's hooks, so it has no
   * other way to ask a host how loud to be.
   */
  logLevel?: number
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
  /**
   * Absolute path to the config file, for reading and patching it. `configPath` keeps the form the
   * host gave, which is what Studio shows.
   */
  configFile: string
}

/**
 * How long the `agent:connect` handshake may go unacknowledged before `studio:ready` is given up
 * on for this open. A Studio that predates the ack never sends one, so this only ever produces a
 * warning, not a reconnect.
 */
const READY_TIMEOUT_MS = 10_000

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
  }
}

/**
 * Schedules another connection attempt.
 *
 * A free function rather than a method: a pending retry timer reaches whatever it closes over, so
 * closing only over `options` (not a `StudioSession`) keeps a queued retry from pinning a closed
 * socket, its hook emitter, or its session id alive for the length of the retry interval.
 */
function reconnect(options: ResolvedOptions): void {
  const { signal, retryInterval, onTokenRejected, logLevel } = options

  if (signal?.aborted) {
    return
  }

  // console.error, not console.info: a CI runner only forwards a child process's stderr live, so
  // an info-level write here would be silently buffered away instead of reaching its log.
  if (logLevel !== undefined && logLevel > logLevelMap.silent) {
    console.error(styleText('dim', `Retrying connection in ${retryInterval}ms to Kubb Studio ...`))
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
    // unhandledRejection that kills the retry loop instead of trying again.
    new StudioSession(options).connect().catch((error: unknown) => {
      if (logLevel !== undefined && logLevel > logLevelMap.silent) {
        console.error(styleText('red', `Reconnect attempt to Kubb Studio failed: ${getErrorMessage(error)}`))
      }

      // A rejected token stays rejected, so retrying only spams 401s until the process is killed.
      // The host learns about it here instead: the startup path already reports its own rejection
      // by throwing, so only the background path needs the callback.
      if (error instanceof InvalidAgentTokenError) {
        onTokenRejected?.(error)

        return
      }

      reconnect(options)
    })
  }, retryInterval)

  signal?.addEventListener('abort', cancel, { once: true })
}

/**
 * One WebSocket session with Studio: opening it, keeping it alive, and running the commands it
 * sends. `createClient` opens one per pool slot and is the only caller.
 */
export class StudioSession {
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
   * What `createAgentSession` handed back, and the marker for whether a session exists at all.
   * Before it resolves there is nothing to disconnect and no sandbox flag to read.
   */
  #session: AgentConnectResponse | undefined
  #ws: WebSocket | undefined
  // Known before the agent announces itself, and refreshed by a later `studio:connect`, so both
  // sides can be named from the first connect on.
  #studioVersion: string | undefined
  #activeJobId: string | null = null

  // Whether the session is over: guards the close event from tearing down twice, and a shutdown
  // from being turned into a reconnect.
  #disposed = false
  // Guards against a second `generate` command starting while one is already running. Without
  // this, two concurrent `generate()` calls share this socket via `setupEventsStream`, and their
  // events interleave with no way for Studio to tell the two runs apart.
  #isGenerating = false
  #heartbeatTimer: ReturnType<typeof setInterval> | undefined
  #readyTimer: ReturnType<typeof setTimeout> | undefined
  // Tracks socket liveness: Studio replies to every ping with a pong. When pongs stop arriving the
  // connection is half-open (e.g. dropped during a Studio deploy) and must be terminated so the
  // reconnect loop can establish a fresh session.
  #lastPongAt = Date.now()
  // The most recent generation's live storage, kept so `studio:files` and `studio:snapshot` can
  // read file content on demand instead of Studio round tripping it back over the socket, and
  // instead of this holding the whole run's output in memory. `paths` is the whitelist a request
  // is checked against, so a caller can only ever read what this run actually produced. Set as
  // soon as `kubb:generation:end` fires, undefined again if a run fails before that.
  #lastGeneration:
    | { storage: Storage; root: string; paths: Set<string>; peerDependencies: Record<string, string>; missingDependencies: Array<string> }
    | undefined

  constructor(options: StudioSessionOptions) {
    this.#options = applyStudioDefaults(options)
  }

  /**
   * A sandbox agent runs on Studio's own infrastructure, so it has no user project to touch.
   */
  get #isSandbox(): boolean {
    return this.#session?.isSandbox === true
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

  async connect(): Promise<void> {
    const { token, studioUrl, signal, heartbeatInterval, installLogger } = this.#options

    await installLogger?.(this.#hooks)

    try {
      // Before the session exists, so a host can cover the wait: `createAgentSession` is a round
      // trip and the socket after it opens without being awaited.
      await this.#hooks.callHook('studio:connecting', { url: studioUrl })

      const session = await createAgentSession({ token, studioUrl })

      this.#session = session
      this.#studioVersion = session.version

      const ws = createWebsocket(session.wsUrl, { headers: { Authorization: `Bearer ${token}` } })
      this.#ws = ws

      this.#listen(ws, 'open', this.#onOpen)
      this.#listen(ws, 'close', this.#onClose)
      this.#listen(ws, 'error', this.#onError)
      this.#listen(ws, 'message', this.#onMessage)

      // `#end` is idempotent, so the close event that follows a shutdown cannot turn it into a
      // reconnect. Tracked like the socket's own listeners: the signal fires once at process exit,
      // so one left behind per reconnect would pile up.
      signal?.addEventListener('abort', this.#onAbort, { once: true })
      this.#unhooks.push(() => signal?.removeEventListener('abort', this.#onAbort))

      this.#heartbeatTimer = setInterval(() => this.#sendHeartbeat(), heartbeatInterval)

      // Standing listener for the whole session. A generation adds the rest of the stream for as
      // long as it runs, so between runs this socket carries errors only.
      this.#unhooks.push(this.#hooks.hook('kubb:error', ({ error }) => sendErrorMessage(ws, error, this.#activeJobId ?? 'connection')))
    } catch (error) {
      // Reaching here means the session was never created (Studio down, a 502 mid-deploy), so no
      // socket exists and none of the socket-driven reconnect paths can fire. Retry from here or
      // the slot is dropped for the lifetime of the process.
      await this.#hooks.callHook('studio:error', { error: toError(error) })

      if (error instanceof InvalidAgentTokenError) {
        throw error
      }

      reconnect(this.#options)
    }
  }

  /**
   * Adds a socket listener and tracks its remover, so `dispose` detaches every listener at once.
   */
  #listen<TEvent extends keyof WebSocket.WebSocketEventMap>(
    ws: WebSocket,
    event: TEvent,
    listener: (event: WebSocket.WebSocketEventMap[TEvent]) => void,
  ): void {
    ws.addEventListener(event, listener)
    this.#unhooks.push(() => ws.removeEventListener(event, listener))
  }

  #warn(message: string): Promise<void> | void {
    return this.#hooks.callHook('studio:warn', { message })
  }

  /**
   * Forwards a failure to Studio over the connection emitter, which `connect` wired to this
   * socket. Swallows a listener's own failure, since this is already the error path.
   */
  #emitError(error: Error): Promise<void> {
    return Promise.resolve(this.#hooks.callHook('kubb:error', { error })).catch(() => {})
  }

  #sendHeartbeat(): void {
    // Two consecutive missed pongs mean the socket is dead even though no close event arrived.
    // Terminate (not close) so a half-open TCP connection can't linger. The resulting close event
    // triggers cleanup and the reconnect loop.
    if (Date.now() - this.#lastPongAt > this.#options.heartbeatInterval * 2) {
      void this.#warn('No reply from Kubb Studio, terminating the stale connection')
      // Stop the timer here rather than waiting for `dispose`, since the close event can lag, and
      // until it runs this interval would re-terminate and re-log every tick.
      clearInterval(this.#heartbeatTimer)
      this.#heartbeatTimer = undefined
      this.#ws?.terminate()

      return
    }

    if (this.#ws) {
      sendAgentMessage(this.#ws, { type: 'agent:ping' })
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

  async #sendConnectedPayload(): Promise<void> {
    const { configPath, root, version, loadConfig, permissions } = this.#options

    if (!this.#ws) {
      return
    }

    const config = await loadConfig()

    sendAgentMessage(this.#ws, {
      type: 'agent:connect',
      payload: {
        versions: { kubb: kubbVersion, agent: version },
        root,
        config: {
          path: configPath,
          file: await this.#readConfigFileView(),
          plugins: config.plugins.map((plugin) => ({
            name: toPackageName(plugin.name),
            // Functions and symbols in plugin options are dropped by `JSON.stringify` on the way out.
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
      },
    })
  }

  async #handleOpen(): Promise<void> {
    this.#lastPongAt = Date.now()
    await this.#hooks.callHook('studio:connected', {
      url: this.#options.studioUrl,
      versions: { studio: this.#studioVersion, kubb: kubbVersion, agent: this.#options.version },
    })

    // Announce readiness without waiting for a `studio:connect` command. The command from the
    // Studio UI is lost when it is sent while the agent is not attached to the session (e.g.
    // reconnecting after a deploy), so the agent introduces itself on every open.
    try {
      await this.#sendConnectedPayload()
      this.#waitForReady()
    } catch (error) {
      await this.#warn(`Failed to send the connect payload: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Arms the timeout for Studio's `studio:ready` acknowledgement. Re-armed on every open, since a
   * command sent while the agent is not attached is lost either way (see `#sendConnectedPayload`),
   * so each reconnect needs its own fresh wait.
   */
  #waitForReady(): void {
    // `#sendConnectedPayload` can still be awaiting `loadConfig()` when the session is disposed,
    // so this runs after teardown too. Arming a timer at that point would hold the process open
    // for `READY_TIMEOUT_MS` for a warning nothing is listening for anymore.
    if (this.#disposed) {
      return
    }

    clearTimeout(this.#readyTimer)
    this.#readyTimer = setTimeout(() => {
      this.#readyTimer = undefined
      // A rejecting `studio:warn` listener would otherwise become an unhandled rejection here,
      // same as `#onOpen` swallows below for the same reason.
      void Promise.resolve(this.#warn(`Kubb Studio did not confirm the connection was ready within ${READY_TIMEOUT_MS}ms`)).catch(() => {})
    }, READY_TIMEOUT_MS)
  }

  // `addEventListener` drops the returned promise, so a host whose logger throws would take the
  // process down with an unhandled rejection instead of just losing a line of output. Nothing is
  // left to report it with at that point, which is why this swallows.
  #onOpen = (): void => void this.#handleOpen().catch(() => {})

  #onAbort = (): void => void this.#end({ reason: 'shutdown', retry: false })

  #onClose = (): void => void this.#end({ retry: true })

  #onError = (): void => {
    void this.#hooks.callHook('studio:error', { error: new Error('Failed to connect to Kubb Studio') })

    this.#onClose()
  }

  /**
   * Drops the socket and detaches every listener and timer this session added. Idempotent, and
   * safe before `connect` opened anything.
   *
   * @internal
   */
  dispose(reason = 'cleanup'): void {
    clearInterval(this.#heartbeatTimer)
    this.#heartbeatTimer = undefined
    clearTimeout(this.#readyTimer)
    this.#readyTimer = undefined

    try {
      // Closed before the listeners go, so the close event this triggers arrives after they are
      // already detached and cannot re-enter `#end`.
      this.#ws?.close(1000, reason)
    } catch {}

    for (const unhook of this.#unhooks) unhook()
    this.#unhooks.length = 0
  }

  /**
   * Ends the session: tells Studio it is over, drops the socket, and optionally reconnects.
   * `#disposed` keeps the close event from running this twice, and a shutdown from reconnecting.
   */
  async #end({ reason, retry }: { reason?: string; retry: boolean }): Promise<void> {
    const { studioUrl, token, logLevel } = this.#options

    if (this.#disposed) {
      return
    }
    this.#disposed = true

    // Announce the shutdown while the socket is still open, so Studio marks the session offline
    // now instead of waiting out the heartbeat window. `sendAgentMessage` is a no-op on a socket
    // that has already closed, which is every other way we get here.
    if (reason === 'shutdown' && this.#ws) {
      sendAgentMessage(this.#ws, { type: 'agent:disconnect', reason: 'shutdown' })
    }

    this.dispose(reason)

    // Nothing to tell Studio about when the session never opened.
    if (this.#session) {
      // Already tearing down, so a failed disconnect changes nothing.
      await disconnect({ sessionId: this.#session.sessionId, studioUrl, token, slug: this.#session.slug, logLevel }).catch(() => {})
    }

    if (retry) {
      reconnect(this.#options)
    }
  }

  #onMessage = async (message: WebSocket.MessageEvent): Promise<void> => {
    try {
      const data = JSON.parse(message.data as string) as AgentMessage

      if (isStudioPongMessage(data)) {
        this.#lastPongAt = Date.now()

        return
      }

      if (isStudioReadyMessage(data)) {
        clearTimeout(this.#readyTimer)
        this.#readyTimer = undefined
        await this.#hooks.callHook('studio:ready', {})

        return
      }

      if (isDisconnectMessage(data)) {
        await this.#handleDisconnect(data.reason)

        return
      }

      if (isCommandMessage(data)) {
        await this.#handleCommand(data)

        return
      }

      await this.#warn(`Ignored an unknown message from Kubb Studio: ${data.type}`)
    } catch (error) {
      await this.#hooks.callHook('studio:error', { error: toError(error) })

      // Errors thrown before `generate()` runs (e.g. config loading, plugin resolution) never
      // reach `generate()`'s own `kubb:error` emission, so without this the Studio UI shows
      // nothing while the agent silently fails.
      await this.#emitError(toError(error))
    }
  }

  /**
   * Studio ended the session itself. A revoked one stays ended, an expired one gets a fresh
   * session, and anything else is left to the socket's own close event.
   */
  async #handleDisconnect(reason: string): Promise<void> {
    await this.#hooks.callHook('studio:disconnected', { reason })

    if (reason !== 'revoked' && reason !== 'expired') {
      return
    }

    // `dispose` unhooks the socket's own `close` listener before returning, which is what actually
    // keeps a real `close` event from re-entering `#end`. `#disposed` is set regardless, so this
    // path stays safe against `#end` being reached some other way later.
    this.#disposed = true
    this.dispose(`session_${reason}`)

    if (reason === 'expired') {
      reconnect(this.#options)
    }
  }

  async #handleCommand(data: AgentMessage & { type: `studio:${string}` }): Promise<void> {
    const ws = this.#ws
    if (!ws) {
      return
    }

    // Every command type is `studio:<verb>`, so the verb alone is what a host wants to show.
    const command = data.type.slice('studio:'.length)

    await this.#hooks.callHook('studio:command:start', { command })

    switch (data.type) {
      case 'studio:generate':
        await this.#handleGenerate(ws, data, command)
        return
      case 'studio:connect':
        this.#studioVersion = data.version ?? this.#studioVersion
        await this.#sendConnectedPayload()
        await this.#hooks.callHook('studio:command:end', { command })
        return
      case 'studio:save':
        await this.#handleSave(ws, data, command)
        return
      case 'studio:snapshot':
        await this.#handleSnapshot(ws, data, command)
        return
      case 'studio:files':
        await this.#handleFiles(ws, data, command)
        return
    }
  }

  async #handleGenerate(ws: WebSocket, data: Extract<AgentMessage, { type: 'studio:generate' }>, command: string): Promise<void> {
    const { root, loadConfig, permissions, client } = this.#options

    if (this.#isGenerating) {
      await this.#warn('Ignored generate: a generation is already in progress')
      await this.#emitError(new Error('A generation is already in progress, please wait for it to finish'))

      return
    }

    this.#isGenerating = true
    this.#activeJobId = data.jobId

    try {
      const config = await loadConfig()
      const patch = data.payload
      const plugins = await mergePlugins(config.plugins, patch?.plugins)
      const adapter = await mergeAdapter(config.adapter, patch?.adapter)

      // A sandbox agent always uses the inline spec (empty string included, since it has no disk
      // file); a local agent only when opted in, and an empty or absent spec falls back to disk.
      const inputOverride = this.#isSandbox ? (patch?.input ?? '') : (permissions.allowInput && patch?.input) || undefined

      if (permissions.allowWrite && this.#isSandbox) {
        await this.#warn('Running in a sandbox, so writing files is disabled')
      }

      if (patch?.input && !this.#canUseInput) {
        // The Docker agent reads `allowInput` from `KUBB_AGENT_ALLOW_INPUT`. The CLI grants it
        // through `--allowInput` or the per-project prompt instead, so each host gets its own remedy.
        const remedy = client?.kind === 'cli' ? '--allowInput, or answer yes when kubb studio asks,' : 'KUBB_AGENT_ALLOW_INPUT=true'
        await this.#warn(`Ignored the spec from Studio; set ${remedy} to generate from it`)
      }

      const resolvedPlugins = plugins ?? config.plugins

      // The session's own emitter carries the run: the host's logger is already on it from
      // `connect`, and these two come off again below, so one run's listeners never see the next.
      // Cleared up front, filled the moment `kubb:generation:end` fires.
      this.#lastGeneration = undefined
      const detach = [
        setupHookListener(this.#hooks, root),
        setupEventsStream(ws, this.#hooks, data.jobId, {
          onGenerationEnd: (result) => {
            this.#lastGeneration = result
          },
        }),
      ]

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
        })
      } finally {
        for (const remove of detach) remove()
      }

      await this.#hooks.callHook('studio:command:end', {
        command,
        info: `${resolvedPlugins.length} plugin${resolvedPlugins.length === 1 ? '' : 's'}, ${this.#canWrite ? 'written to disk' : 'in memory'}${inputOverride !== undefined ? ', from a Studio spec' : ''}`,
      })
    } finally {
      this.#isGenerating = false
      this.#activeJobId = null
    }
  }

  async #handleSave(ws: WebSocket, data: Extract<AgentMessage, { type: 'studio:save' }>, command: string): Promise<void> {
    const { configPath, configFile } = this.#options

    // Studio waits on an `agent:save` for every `studio:save`, so every path out of this function
    // sends one. `edits` is checked before it is walked: the message crosses the same trust
    // boundary as the values inside it.
    if (!Array.isArray(data.edits)) {
      await this.#warn('Ignored save: the message carried no edits')

      sendAgentMessage(ws, { type: 'agent:save', jobId: data.jobId, payload: { outcomes: [], changed: false } })

      return
    }

    const edits = data.edits
    const refuse = (reason: string) =>
      sendAgentMessage(ws, {
        type: 'agent:save',
        jobId: data.jobId,
        payload: { outcomes: edits.map((edit) => ({ edit, applied: false, reason })), changed: false },
      })

    if (!this.#canEditConfig) {
      await this.#warn('Ignored save: editing kubb.config.ts was not granted')

      refuse('the agent was not granted permission to edit kubb.config.ts')

      return
    }

    // A generation reloads the config while it runs, so rewriting the file underneath it would
    // leave that run working from half the change.
    if (this.#isGenerating) {
      refuse('a generation is in progress')

      return
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

      sendAgentMessage(ws, {
        type: 'agent:save',
        jobId: data.jobId,
        payload: { outcomes, changed, file: changed ? await this.#readConfigFileView(patched) : undefined },
      })

      const applied = outcomes.filter((outcome) => outcome.applied).length
      await this.#hooks.callHook('studio:command:end', { command, info: `applied ${applied}/${outcomes.length} edits to ${configPath}` })
    } catch (error) {
      // An unreadable config, a read-only filesystem. Reported as a refusal of every edit so
      // Studio hears back rather than waiting on a reply that never comes.
      await this.#hooks.callHook('studio:error', { error: toError(error) })

      refuse(getErrorMessage(error))
    }
  }

  async #handleSnapshot(ws: WebSocket, data: Extract<AgentMessage, { type: 'studio:snapshot' }>, command: string): Promise<void> {
    const refuse = (message: string) => sendAgentMessage(ws, { type: 'agent:snapshot', jobId: data.jobId, payload: { status: 'error', message } })

    if (this.#isSandbox) {
      await this.#warn('Ignored snapshot: a sandbox agent has no project to build a package from')
      refuse('a sandbox agent has no project to build a package from')

      return
    }

    const { name, version, bundledDependencies, uploadPath } = data.payload

    if (!name || !version || !uploadPath) {
      await this.#warn('Ignored snapshot: the message was missing required fields')
      refuse('the message was missing required fields')

      return
    }

    const generation = this.#lastGeneration

    if (!generation) {
      await this.#warn('Ignored snapshot: no prior generation to pack')
      refuse('no prior generation exists to pack, run a generation first')

      return
    }

    const bundled = new Set(bundledDependencies ?? [])
    const missing = generation.missingDependencies.filter((dependency) => !bundled.has(dependency))

    if (missing.length) {
      await this.#warn(`Ignored snapshot: missing dependencies: ${missing.join(', ')}`)
      refuse(`missing dependencies: ${missing.join(', ')}`)

      return
    }

    try {
      const files: Record<string, string> = {}
      await inParallel({
        items: [...generation.paths],
        limit: FILE_READ_CONCURRENCY,
        run: async (relativePath) => {
          const content = await generation.storage.readItem(absoluteStoragePath(generation.root, relativePath))
          if (content !== null) files[relativePath] = content
        },
      })

      const { bytes, integrity } = await createSnapshotPackage(files, { name, version, peerDependencies: generation.peerDependencies })

      // The tarball can't go on this request: Studio's handler answers before reading the body,
      // so the connection drops mid-upload. Ask for the redirect with an empty body first, then
      // PUT the bytes to wherever it points. That also keeps the bearer token off the storage
      // request, since it's a fresh call rather than a followed redirect.
      const { token, studioUrl } = this.#options
      const redirect = await fetch(new URL(uploadPath, studioUrl), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'manual',
      })
      const storageUrl = redirect.headers.get('location')
      if (redirect.status !== 307 || !storageUrl) {
        throw new Error(`Studio did not provide a storage URL (status ${redirect.status})`)
      }

      const response = await fetch(storageUrl, { method: 'PUT', body: new Uint8Array(bytes) })
      if (!response.ok) {
        throw new Error(`Snapshot upload failed with status ${response.status}`)
      }

      sendAgentMessage(ws, {
        type: 'agent:snapshot',
        jobId: data.jobId,
        payload: { status: 'ok', integrity, peerDependencies: generation.peerDependencies },
      })
      await this.#hooks.callHook('studio:command:end', {
        command,
        info: `packed ${Object.keys(files).length} file${Object.keys(files).length === 1 ? '' : 's'}`,
      })
    } catch (error) {
      await this.#hooks.callHook('studio:error', { error: toError(error) })

      refuse(getErrorMessage(error))
    }
  }

  async #handleFiles(ws: WebSocket, data: Extract<AgentMessage, { type: 'studio:files' }>, command: string): Promise<void> {
    const { client } = this.#options
    const refuse = (message: string) => sendAgentMessage(ws, { type: 'agent:files', jobId: data.jobId, payload: { status: 'error', message } })

    if (!this.#canRead) {
      await this.#warn('Ignored files: reading generated files was not granted')

      // Each host grants it a different way.
      const remedy = client?.kind === 'cli' ? '--allow-read, or answer yes when kubb studio asks,' : 'KUBB_AGENT_ALLOW_READ=true'
      refuse(`the agent was not granted permission to read generated files; set ${remedy} to allow it`)

      return
    }

    // `paths` came off the wire, so check its shape before walking it.
    if (!Array.isArray(data.payload?.paths)) {
      await this.#warn('Ignored files: the message carried no paths')
      refuse('the message carried no paths')

      return
    }

    const { paths } = data.payload

    if (paths.length > MAX_FILES_PER_REQUEST) {
      await this.#warn(`Ignored files: requested ${paths.length} paths, more than the ${MAX_FILES_PER_REQUEST} allowed per request`)
      refuse(`at most ${MAX_FILES_PER_REQUEST} paths may be requested at once`)

      return
    }

    const generation = this.#lastGeneration

    if (!generation) {
      await this.#warn('Ignored files: no prior generation to read from')
      refuse('no prior generation to read from, run a generation first')

      return
    }

    // Checked against the paths this run actually produced before touching storage, so a caller
    // can only ever read what that run produced, never an arbitrary path on disk.
    const requested = paths.filter((path) => generation.paths.has(path))
    const files: Record<string, string> = {}
    await inParallel({
      items: requested,
      limit: FILE_READ_CONCURRENCY,
      run: async (path) => {
        const content = await generation.storage.readItem(absoluteStoragePath(generation.root, path))
        if (content !== null) files[path] = content
      },
    })

    sendAgentMessage(ws, { type: 'agent:files', jobId: data.jobId, payload: { status: 'ok', files } })
    await this.#hooks.callHook('studio:command:end', {
      command,
      info: `read ${Object.keys(files).length}/${paths.length} requested file${paths.length === 1 ? '' : 's'}`,
    })
  }
}
