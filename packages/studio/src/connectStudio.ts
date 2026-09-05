import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage, read, toError } from '@internals/utils'
import { type Config, fsStorage, Hookable, type KubbHooks, memoryStorage } from '@kubb/core'
import { version as kubbVersion } from '../package.json'
import { setupHookListener } from './hooks.ts'
import {
  type AgentConnectResponse,
  type AgentMessage,
  type ClientInfo,
  type ConfigFileView,
  isCommandMessage,
  isDisconnectMessage,
  isStudioPingMessage,
} from './protocol/index.ts'
import { createAgentSession, disconnect, InvalidAgentTokenError } from './api.ts'
import { generate } from './generate.ts'
import { agentDefaults } from './constants.ts'
import { mergeAdapter, mergePlugins } from './resolveConfig.ts'
import type WebSocket from 'ws'
import { createWebsocket, sendAgentMessage, sendErrorMessage, setupEventsStream } from './ws.ts'

export type ConnectToStudioOptions = {
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
  allowWrite?: boolean
  /**
   * Whether Studio may edit the project's `kubb.config.ts`. Granted separately from `allowWrite`,
   * which only covers generated output: this rewrites a file the user wrote by hand.
   */
  allowConfigEdit?: boolean
  allowInput?: boolean
  /**
   * Whether the formatter, the linter, and `output.postGenerate` may run as child processes.
   * Defaults to true, which is what the Docker agent has always done. The CLI runs in the user's
   * own project, so it defaults this off and asks before granting it.
   */
  allowExec?: boolean
  root?: string
  retryInterval?: number
  heartbeatInterval?: number
  /**
   * Number of pool sessions this agent serves. Read by `createClient`, which opens one
   * `connectToStudio` per slot, and reported to Studio at registration.
   */
  poolSize?: number
  /**
   * Aborting this disconnects the session and stops the reconnect loop. Hosts wire it to their own
   * shutdown: Nitro's `close` hook, or `SIGINT`/`SIGTERM` in the CLI.
   */
  signal?: AbortSignal
  /**
   * Installs listeners on an event emitter, once for the session and once per generation. Left out,
   * the runtime prints nothing, which is what a library should default to.
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
type ResolvedOptions = ConnectToStudioOptions & {
  studioUrl: string
  root: string
  allowWrite: boolean
  allowConfigEdit: boolean
  allowInput: boolean
  allowExec: boolean
  retryInterval: number
  heartbeatInterval: number
  /**
   * Absolute path to the config file, for reading and patching it. `configPath` stays as the host
   * gave it, since that is the project-relative form Studio shows.
   */
  configFile: string
}

/**
 * Fills in the defaults a session needs from a host's options: the hosted Studio URL, the current
 * working directory, and every permission off unless granted.
 *
 * Idempotent, so a reconnect can hand an already-resolved bag straight back in.
 */
function applyStudioDefaults(options: ConnectToStudioOptions): ResolvedOptions {
  const root = options.root ?? process.cwd()

  return {
    ...options,
    studioUrl: options.studioUrl ?? agentDefaults.studioUrl,
    root,
    // `configPath` is relative to the agent's root unless it is already absolute, which is what
    // `resolve` does on its own.
    configFile: path.resolve(root, options.configPath),
    allowWrite: options.allowWrite ?? false,
    allowConfigEdit: options.allowConfigEdit ?? false,
    allowInput: options.allowInput ?? false,
    allowExec: options.allowExec ?? false,
    retryInterval: options.retryInterval ?? agentDefaults.retryIntervalMs,
    // Studio counts an agent offline once its last ping is older than its liveness window, so a
    // slower cadence would make a healthy agent invisible. Clamped here rather than in a host's
    // env parsing, so every host is held to the contract.
    heartbeatInterval: Math.min(options.heartbeatInterval ?? agentDefaults.heartbeatIntervalMs, agentDefaults.heartbeatIntervalMs),
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
  const { signal, retryInterval, onTokenRejected } = options

  if (signal?.aborted) {
    return
  }

  console.info(styleText('dim', `Retrying connection in ${retryInterval}ms to Kubb Studio ...`))

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
    connectToStudio(options).catch((error: unknown) => {
      console.error(styleText('red', `Reconnect attempt to Kubb Studio failed: ${getErrorMessage(error)}`))

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
 * One WebSocket session with Studio: opening it, keeping it alive, and running whatever Studio
 * sends over it. `connectToStudio` is the module's only public entry point; this class exists so
 * that session's several pieces of mutable state (the socket, the heartbeat timer, whether a
 * generation is running) live as fields instead of a pile of closed-over `let`s, matching how
 * `KubbDriver` holds a single build's state in `@kubb/core`.
 */
class StudioSession {
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
   * What Studio handed back. Set once `createAgentSession` resolves, and the marker for whether a
   * session exists at all: until then there is nothing to disconnect and no sandbox flag to read.
   */
  #session: AgentConnectResponse | undefined
  #ws: WebSocket | undefined
  // Known before the agent announces itself, and refreshed by a later `studio:connect`, so both
  // sides can be named from the first connect on.
  #studioVersion: string | undefined

  // Whether the session is over: guards the close event from tearing down twice, and a shutdown
  // from being turned into a reconnect.
  #disposed = false
  // Guards against a second `generate` command starting while one is already running. Without
  // this, two concurrent `generate()` calls share this socket via `setupEventsStream`, and their
  // events interleave with no way for Studio to tell the two runs apart.
  #isGenerating = false
  #heartbeatTimer: ReturnType<typeof setInterval> | undefined
  // Tracks socket liveness: Studio replies to every ping with a pong. When pongs stop arriving the
  // connection is half-open (e.g. dropped during a Studio deploy) and must be terminated so the
  // reconnect loop can establish a fresh session.
  #lastPongAt = Date.now()

  constructor(options: ConnectToStudioOptions) {
    this.#options = applyStudioDefaults(options)
  }

  /**
   * A sandbox agent runs on Studio's own infrastructure, so it has no user project: it never
   * writes to disk and never edits a config file that is not there.
   */
  get #isSandbox(): boolean {
    return this.#session?.isSandbox === true
  }

  get #canWrite(): boolean {
    return !this.#isSandbox && this.#options.allowWrite
  }

  get #canEditConfig(): boolean {
    return !this.#isSandbox && this.#options.allowConfigEdit
  }

  /**
   * A sandbox agent always generates from the spec Studio supplies; a local agent only when opted in.
   */
  get #canUseInput(): boolean {
    return this.#isSandbox || this.#options.allowInput
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

      // The socket's own close event fires after this, and `#end` is idempotent, so the shutdown
      // path cannot be turned into a reconnect by the close that follows it. Tracked like every
      // other listener: the signal itself only fires at process exit, so a reconnect that left one
      // behind would pile them up for the life of the process.
      signal?.addEventListener('abort', this.#onAbort, { once: true })
      this.#unhooks.push(() => signal?.removeEventListener('abort', this.#onAbort))

      this.#heartbeatTimer = setInterval(() => this.#sendHeartbeat(), heartbeatInterval)

      // Only `kubb:error` is ever fired on the connection emitter. Every generation event goes
      // through its own emitter below, so it gets that one listener rather than the full stream.
      this.#unhooks.push(this.#hooks.hook('kubb:error', ({ error }) => sendErrorMessage(ws, error)))
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
   * Forwards a failure to Studio over the connection emitter, which `setupEventsStream` has
   * already wired to this socket. Swallows a listener's own failure: this is already the error path.
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
   * Skipped when the host did not grant `allowConfigEdit`. The patcher pulls in `magicast`
   * (~25ms, ~55MB RSS), so read-only agents never import it.
   *
   * Not cached: the user can edit the file between two Studio actions.
   */
  async #readConfigFileView(source?: string): Promise<ConfigFileView | undefined> {
    if (!this.#canEditConfig) {
      return undefined
    }

    try {
      const { readConfig } = await import('./configFile.ts')

      return readConfig(source ?? (await read(this.#options.configFile)))
    } catch (error) {
      await this.#warn(`Could not read ${this.#options.configFile}: ${getErrorMessage(error)}`)

      return undefined
    }
  }

  async #sendConnectedPayload(): Promise<void> {
    const { configPath, root, version, loadConfig, allowExec } = this.#options

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
            name: `@kubb/${plugin.name}`,
            // Functions and symbols in plugin options are dropped by `JSON.stringify` on the way out.
            options: plugin.options ?? {},
          })),
        },
        permissions: {
          allowWrite: this.#canWrite,
          allowInput: this.#canUseInput,
          allowExec,
          allowConfigEdit: this.#canEditConfig,
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
    } catch (error) {
      await this.#warn(`Failed to send the connect payload: ${getErrorMessage(error)}`)
    }
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
   * safe to call before `connect` ever opened anything.
   *
   * @internal
   */
  dispose(reason = 'cleanup'): void {
    clearInterval(this.#heartbeatTimer)
    this.#heartbeatTimer = undefined

    try {
      // Closed before the listeners go, so the close event this triggers arrives after they are
      // already detached and cannot re-enter `#end`.
      this.#ws?.close(1000, reason)
    } catch {}

    for (const unhook of this.#unhooks) unhook()
    this.#unhooks.length = 0
  }

  /**
   * Ends the session: tells Studio it is over, disposes of the socket, and optionally schedules a
   * reconnect. `#disposed` guards against the close event running this a second time, and against
   * a shutdown reconnecting.
   */
  async #end({ reason, retry }: { reason?: string; retry: boolean }): Promise<void> {
    const { studioUrl, token } = this.#options

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
      await disconnect({ sessionId: this.#session.sessionId, studioUrl, token, slug: this.#session.slug }).catch(() => {})
    }

    if (retry) {
      reconnect(this.#options)
    }
  }

  #onMessage = async (message: WebSocket.MessageEvent): Promise<void> => {
    try {
      const data = JSON.parse(message.data as string) as AgentMessage

      if (isStudioPingMessage(data)) {
        this.#lastPongAt = Date.now()

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
    }
  }

  async #handleGenerate(ws: WebSocket, data: Extract<AgentMessage, { type: 'studio:generate' }>, command: string): Promise<void> {
    const { root, loadConfig, allowInput, allowWrite, allowExec, client, installLogger } = this.#options

    if (this.#isGenerating) {
      await this.#warn('Ignored generate: a generation is already in progress')
      await this.#emitError(new Error('A generation is already in progress, please wait for it to finish'))

      return
    }

    this.#isGenerating = true

    try {
      const config = await loadConfig()
      const patch = data.payload
      const plugins = await mergePlugins(config.plugins, patch?.plugins)
      const adapter = await mergeAdapter(config.adapter, patch?.adapter)

      // A sandbox agent always uses the inline spec (empty string included, since it has no disk
      // file); a local agent only when opted in, and an empty or absent spec falls back to disk.
      const inputOverride = this.#isSandbox ? (patch?.input ?? '') : (allowInput && patch?.input) || undefined

      if (allowWrite && this.#isSandbox) {
        await this.#warn('Running in a sandbox, so writing files is disabled')
      }

      if (patch?.input && !this.#canUseInput) {
        // The Docker agent reads `allowInput` from `KUBB_AGENT_ALLOW_INPUT`. The CLI grants it
        // through `--allowInput` or the per-project prompt instead, so each host gets its own remedy.
        const remedy = client?.kind === 'cli' ? '--allowInput, or answer yes when kubb studio asks,' : 'KUBB_AGENT_ALLOW_INPUT=true'
        await this.#warn(`Ignored the spec from Studio; set ${remedy} to generate from it`)
      }

      const generationHooks = new Hookable<KubbHooks>()
      await installLogger?.(generationHooks)
      setupHookListener(generationHooks, root)
      setupEventsStream(ws, generationHooks)

      const resolvedPlugins = plugins ?? config.plugins

      await generate({
        config: {
          ...config,
          root,
          input: inputOverride ?? config.input,
          storage: this.#canWrite ? fsStorage() : memoryStorage(),
          output: allowExec ? { ...config.output } : { ...config.output, format: false, lint: false, postGenerate: [] },
          plugins: resolvedPlugins,
          adapter,
        },
        hooks: generationHooks,
      })

      await this.#hooks.callHook('studio:command:end', {
        command,
        info: `${resolvedPlugins.length} plugin${resolvedPlugins.length === 1 ? '' : 's'}, ${this.#canWrite ? 'written to disk' : 'in memory'}${inputOverride !== undefined ? ', from a Studio spec' : ''}`,
      })
    } finally {
      this.#isGenerating = false
    }
  }

  async #handleSave(ws: WebSocket, data: Extract<AgentMessage, { type: 'studio:save' }>, command: string): Promise<void> {
    const { configPath, configFile } = this.#options

    // Studio waits on an `agent:save` for every `studio:save`, so every path out of this function
    // sends one. `edits` is checked before it is walked: the message crosses the same trust
    // boundary as the values inside it.
    if (!Array.isArray(data.edits)) {
      await this.#warn('Ignored save: the message carried no edits')

      sendAgentMessage(ws, { type: 'agent:save', payload: { outcomes: [], changed: false } })

      return
    }

    const edits = data.edits
    const refuse = (reason: string) =>
      sendAgentMessage(ws, {
        type: 'agent:save',
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
      const { applyConfigEdits } = await import('./configFile.ts')
      const current = await read(configFile)
      const { source: patched, outcomes, changed } = applyConfigEdits(current, edits)

      if (changed) {
        // `writeFile` rather than the `write` helper: that one trims and re-terminates what it
        // writes, which is right for generated output and wrong for a file the user wrote by hand.
        await writeFile(configFile, patched, 'utf-8')
      }

      sendAgentMessage(ws, {
        type: 'agent:save',
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
}

export async function connectToStudio(options: ConnectToStudioOptions): Promise<void> {
  await new StudioSession(options).connect()
}
