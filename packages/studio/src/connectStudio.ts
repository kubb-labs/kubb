import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { getErrorMessage, toError } from '@internals/utils'
import { type Config, fsStorage, Hookable, type KubbHooks, memoryStorage } from '@kubb/core'
import { version as kubbVersion } from '../package.json'
import { setupHookListener } from './hooks.ts'
import { type AgentMessage, type ClientInfo, type ConfigFileView, isCommandMessage, isDisconnectMessage, isStudioPingMessage } from './protocol/index.ts'
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
 * Schedules another connection attempt.
 *
 * A free function rather than a method: a pending retry timer reaches whatever it closes over, so
 * closing only over `options` (not a `StudioSession`) keeps a queued retry from pinning a closed
 * socket, its hook emitter, or its session id alive for the length of the retry interval.
 */
function reconnect(options: ConnectToStudioOptions): void {
  const { signal, retryInterval = agentDefaults.retryIntervalMs, onTokenRejected } = options

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
  readonly #options: ConnectToStudioOptions
  readonly #token: string
  readonly #studioUrl: string
  readonly #configPath: string
  readonly #loadConfig: () => Promise<Config>
  readonly #version: string
  readonly #client: ClientInfo | undefined
  readonly #allowWrite: boolean
  readonly #allowConfigEdit: boolean
  readonly #allowInput: boolean
  readonly #allowExec: boolean
  readonly #root: string
  readonly #heartbeatInterval: number
  readonly #signal: AbortSignal | undefined
  readonly #installLogger: ((hooks: Hookable<KubbHooks>) => void | Promise<void>) | undefined
  // Each session gets its own isolated event emitter so generation events from one session do not
  // bleed into another session's WebSocket stream.
  readonly #hooks = new Hookable<KubbHooks>()

  // Known once `createAgentSession` resolves.
  #sessionId = ''
  #slug: string | null | undefined
  #ws: WebSocket | undefined
  // Known before the agent announces itself, and refreshed by a later `studio:connect`, so both
  // sides can be named from the first connect on.
  #studioVersion: string | undefined
  // Effective permissions: always disabled in sandbox mode.
  #canWrite = false
  // A sandbox has no user project to edit, so a config edit is never granted there.
  #canEditConfig = false
  #configFilePath = ''
  // A sandbox agent always generates from the spec Studio supplies; a local agent only when opted in.
  #canUseInput = false
  #isSandbox = false

  // Tracks whether the studio server explicitly disconnected us (no reconnect needed).
  #serverDisconnected = false
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
    this.#options = options
    this.#token = options.token
    this.#studioUrl = options.studioUrl ?? agentDefaults.studioUrl
    this.#configPath = options.configPath
    this.#loadConfig = options.loadConfig
    this.#version = options.version
    this.#client = options.client
    // Every permission is off unless the host grants it.
    this.#allowWrite = options.allowWrite ?? false
    this.#allowConfigEdit = options.allowConfigEdit ?? false
    this.#allowInput = options.allowInput ?? false
    this.#allowExec = options.allowExec ?? false
    this.#root = options.root ?? process.cwd()
    this.#signal = options.signal
    this.#installLogger = options.installLogger
    // Studio counts an agent offline once its last ping is older than its liveness window, so a
    // slower cadence would make a healthy agent invisible. Clamped here rather than in a host's
    // env parsing, so every host is held to the contract.
    this.#heartbeatInterval = Math.min(options.heartbeatInterval ?? agentDefaults.heartbeatIntervalMs, agentDefaults.heartbeatIntervalMs)
  }

  async connect(): Promise<void> {
    await this.#installLogger?.(this.#hooks)

    try {
      // Before the session exists, so a host can cover the wait: `createAgentSession` is a round
      // trip and the socket after it opens without being awaited.
      await this.#hooks.callHook('studio:connecting', { url: this.#studioUrl })

      const { sessionId, slug, wsUrl, isSandbox, version: sessionStudioVersion } = await createAgentSession({ token: this.#token, studioUrl: this.#studioUrl })

      this.#sessionId = sessionId
      this.#slug = slug
      this.#studioVersion = sessionStudioVersion
      this.#isSandbox = isSandbox
      this.#canWrite = isSandbox ? false : this.#allowWrite
      this.#canEditConfig = isSandbox ? false : this.#allowConfigEdit
      // `configPath` is relative to the agent's root unless it is already absolute, which is what
      // `resolve` does on its own.
      this.#configFilePath = path.resolve(this.#root, this.#configPath)
      this.#canUseInput = isSandbox || this.#allowInput

      const ws = createWebsocket(wsUrl, { headers: { Authorization: `Bearer ${this.#token}` } })
      this.#ws = ws

      ws.addEventListener('open', this.#onOpen)
      ws.addEventListener('close', this.#onClose)
      ws.addEventListener('error', this.#onError)
      ws.addEventListener('message', this.#onMessage)
      // The socket's own close event fires after this, and `#teardown` is idempotent, so the
      // shutdown path cannot be turned into a reconnect by the close that follows it.
      this.#signal?.addEventListener('abort', this.#onAbort, { once: true })

      this.#heartbeatTimer = setInterval(() => this.#sendHeartbeat(), this.#heartbeatInterval)

      // Only `kubb:error` is ever fired on the connection emitter. Every generation event goes
      // through its own emitter below, so it gets that one listener rather than the full stream.
      this.#hooks.hook('kubb:error', ({ error }) => sendErrorMessage(ws, error))
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

  #sendHeartbeat(): void {
    // Two consecutive missed pongs mean the socket is dead even though no close event arrived.
    // Terminate (not close) so a half-open TCP connection can't linger. The resulting close event
    // triggers cleanup and the reconnect loop.
    if (Date.now() - this.#lastPongAt > this.#heartbeatInterval * 2) {
      void this.#hooks.callHook('studio:warn', { message: 'No reply from Kubb Studio, terminating the stale connection' })
      // Stop the timer here rather than waiting for `#cleanup`, since the close event can lag, and
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

      return readConfig(source ?? (await readFile(this.#configFilePath, 'utf-8')))
    } catch (error) {
      await this.#hooks.callHook('studio:warn', { message: `Could not read ${this.#configFilePath}: ${getErrorMessage(error)}` })

      return undefined
    }
  }

  async #sendConnectedPayload(): Promise<void> {
    if (!this.#ws) {
      return
    }

    const config = await this.#loadConfig()

    sendAgentMessage(this.#ws, {
      type: 'agent:connect',
      payload: {
        versions: { kubb: kubbVersion, agent: this.#version },
        root: this.#root,
        config: {
          path: this.#configPath,
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
          allowExec: this.#allowExec,
          allowConfigEdit: this.#canEditConfig,
        },
      },
    })
  }

  async #handleOpen(): Promise<void> {
    this.#lastPongAt = Date.now()
    await this.#hooks.callHook('studio:connected', {
      url: this.#studioUrl,
      versions: { studio: this.#studioVersion, kubb: kubbVersion, agent: this.#version },
    })

    // Announce readiness without waiting for a `studio:connect` command. The command from the
    // Studio UI is lost when it is sent while the agent is not attached to the session (e.g.
    // reconnecting after a deploy), so the agent introduces itself on every open.
    try {
      await this.#sendConnectedPayload()
    } catch (error) {
      await this.#hooks.callHook('studio:warn', { message: `Failed to send the connect payload: ${getErrorMessage(error)}` })
    }
  }

  // `addEventListener` drops the returned promise, so a host whose logger throws would take the
  // process down with an unhandled rejection instead of just losing a line of output. Nothing is
  // left to report it with at that point, which is why this swallows.
  #onOpen = (): void => void this.#handleOpen().catch(() => {})

  #onAbort = (): void => void this.#teardown({ reason: 'shutdown', retry: false })

  #cleanup(reason = 'cleanup'): void {
    clearInterval(this.#heartbeatTimer)
    this.#heartbeatTimer = undefined

    // This connection is over, so its shutdown listener must go with it. Otherwise every
    // reconnect leaves one behind on a signal that only fires at process exit.
    this.#signal?.removeEventListener('abort', this.#onAbort)

    this.#hooks.removeAllHooks()

    const ws = this.#ws
    if (!ws) {
      return
    }

    try {
      ws.close(1000, reason)
    } catch {}

    ws.removeEventListener('open', this.#onOpen)
    ws.removeEventListener('close', this.#onClose)
    ws.removeEventListener('error', this.#onError)
    ws.removeEventListener('message', this.#onMessage)
  }

  /**
   * Drops the socket and tells Studio the session is over. `#serverDisconnected` guards against
   * the close event running this a second time, and against a shutdown reconnecting.
   */
  async #teardown({ reason, retry }: { reason?: string; retry: boolean }): Promise<void> {
    if (this.#serverDisconnected) {
      return
    }
    this.#serverDisconnected = true

    // Announce the shutdown while the socket is still open, so Studio marks the session offline
    // now instead of waiting out the heartbeat window. `sendAgentMessage` is a no-op on a socket
    // that has already closed, which is every other way we get here.
    if (reason === 'shutdown' && this.#ws) {
      sendAgentMessage(this.#ws, { type: 'agent:disconnect', reason: 'shutdown' })
    }

    this.#cleanup(reason)
    // Already tearing down, so a failed disconnect changes nothing.
    await disconnect({ sessionId: this.#sessionId, studioUrl: this.#studioUrl, token: this.#token, slug: this.#slug }).catch(() => {})

    if (retry) {
      reconnect(this.#options)
    }
  }

  #onClose = (): void => void this.#teardown({ retry: true })

  #onError = (): void => {
    void this.#hooks.callHook('studio:error', { error: new Error('Failed to connect to Kubb Studio') })

    this.#onClose()
  }

  #onMessage = async (message: WebSocket.MessageEvent): Promise<void> => {
    try {
      const data = JSON.parse(message.data as string) as AgentMessage

      if (isStudioPingMessage(data)) {
        this.#lastPongAt = Date.now()

        return
      }

      if (isDisconnectMessage(data)) {
        await this.#hooks.callHook('studio:disconnected', { reason: data.reason })

        if (data.reason === 'revoked') {
          // `#cleanup` already unhooks the socket's own `close` listener before returning, which is
          // what actually keeps a real `close` event from re-entering `#teardown`. Set regardless,
          // so this path stays safe against `#teardown` being reached some other way later.
          this.#serverDisconnected = true
          this.#cleanup(`session_${data.reason}`)
          return
        }

        if (data.reason === 'expired') {
          this.#serverDisconnected = true
          this.#cleanup()
          reconnect(this.#options)

          return
        }

        return
      }

      if (isCommandMessage(data)) {
        await this.#handleCommand(data)

        return
      }

      await this.#hooks.callHook('studio:warn', { message: `Ignored an unknown message from Kubb Studio: ${data.type}` })
    } catch (error) {
      await this.#hooks.callHook('studio:error', { error: toError(error) })

      // Errors thrown before `generate()` runs (e.g. config loading, plugin resolution) never
      // reach `generate()`'s own `kubb:error` emission, so without this the Studio UI shows
      // nothing while the agent silently fails. Forward them on the connection-level `#hooks`
      // emitter, already wired to this socket via `setupEventsStream`.
      await Promise.resolve(this.#hooks.callHook('kubb:error', { error: toError(error) })).catch(() => {})
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

    if (data.type === 'studio:generate') {
      await this.#handleGenerate(ws, data, command)

      return
    }

    if (data.type === 'studio:connect') {
      this.#studioVersion = data.version ?? this.#studioVersion
      await this.#sendConnectedPayload()

      await this.#hooks.callHook('studio:command:end', { command })

      return
    }

    if (data.type === 'studio:save') {
      await this.#handleSave(ws, data, command)
    }
  }

  async #handleGenerate(ws: WebSocket, data: Extract<AgentMessage, { type: 'studio:generate' }>, command: string): Promise<void> {
    if (this.#isGenerating) {
      await this.#hooks.callHook('studio:warn', { message: 'Ignored generate: a generation is already in progress' })

      await Promise.resolve(
        this.#hooks.callHook('kubb:error', { error: new Error('A generation is already in progress, please wait for it to finish') }),
      ).catch(() => {})

      return
    }

    this.#isGenerating = true

    try {
      const config = await this.#loadConfig()
      const patch = data.payload
      const plugins = await mergePlugins(config.plugins, patch?.plugins)
      const adapter = await mergeAdapter(config.adapter, patch?.adapter)

      // A sandbox agent always uses the inline spec (empty string included, since it has no disk
      // file); a local agent only when opted in, and an empty or absent spec falls back to disk.
      const inputOverride = this.#isSandbox ? (patch?.input ?? '') : (this.#allowInput && patch?.input) || undefined

      if (this.#allowWrite && this.#isSandbox) {
        await this.#hooks.callHook('studio:warn', { message: 'Running in a sandbox, so writing files is disabled' })
      }

      if (patch?.input && !this.#canUseInput) {
        // The Docker agent reads `allowInput` from `KUBB_AGENT_ALLOW_INPUT`. The CLI grants it
        // through `--allowInput` or the per-project prompt instead, so each host gets its own remedy.
        const remedy = this.#client?.kind === 'cli' ? '--allowInput, or answer yes when kubb studio asks,' : 'KUBB_AGENT_ALLOW_INPUT=true'
        await this.#hooks.callHook('studio:warn', { message: `Ignored the spec from Studio; set ${remedy} to generate from it` })
      }

      const generationHooks = new Hookable<KubbHooks>()
      await this.#installLogger?.(generationHooks)
      setupHookListener(generationHooks, this.#root)
      setupEventsStream(ws, generationHooks)

      const resolvedPlugins = plugins ?? config.plugins

      await generate({
        config: {
          ...config,
          root: this.#root,
          input: inputOverride ?? config.input,
          storage: this.#canWrite ? fsStorage() : memoryStorage(),
          output: this.#allowExec ? { ...config.output } : { ...config.output, format: false, lint: false, postGenerate: [] },
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
    // Studio waits on an `agent:save` for every `studio:save`, so every path out of this function
    // sends one. `edits` is checked before it is walked: the message crosses the same trust
    // boundary as the values inside it.
    if (!Array.isArray(data.edits)) {
      await this.#hooks.callHook('studio:warn', { message: 'Ignored save: the message carried no edits' })

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
      await this.#hooks.callHook('studio:warn', { message: 'Ignored save: editing kubb.config.ts was not granted' })

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
      const current = await readFile(this.#configFilePath, 'utf-8')
      const { source: patched, outcomes, changed } = applyConfigEdits(current, edits)

      if (changed) {
        await writeFile(this.#configFilePath, patched, 'utf-8')
      }

      sendAgentMessage(ws, {
        type: 'agent:save',
        payload: { outcomes, changed, file: changed ? await this.#readConfigFileView(patched) : undefined },
      })

      const applied = outcomes.filter((outcome) => outcome.applied).length
      await this.#hooks.callHook('studio:command:end', { command, info: `applied ${applied}/${outcomes.length} edits to ${this.#configPath}` })
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
