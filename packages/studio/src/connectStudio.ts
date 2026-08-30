import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { getErrorMessage } from '@internals/utils'
import { type Config, fsStorage, Hookable, memoryStorage } from '@kubb/core'
import { version as kubbVersion } from '@kubb/core/package.json'
import { type AgentHooks, setupHookListener } from './hooks.ts'
import { type AgentMessage, type ClientInfo, type ConfigFileView, isCommandMessage, isDisconnectMessage, isPongMessage } from './protocol/index.ts'
import { createAgentSession, disconnect, InvalidAgentTokenError } from './api.ts'
import { generate } from './generate.ts'
import { agentDefaults } from './constants.ts'
import { logger } from './logger.ts'
import { assertAllowedPlugins, mergeAdapter, mergePlugins } from './resolveConfig.ts'
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
  /**
   * Module specifiers Studio may name in a `generate` payload. When set, a payload naming anything
   * else is rejected instead of imported — `resolvePlugins` does a bare `await import(name)`, so
   * without this Studio can execute any module reachable from the project's `node_modules`.
   * Unset means no restriction, matching the Docker image where the plugin set is fixed at build time.
   */
  allowedPlugins?: ReadonlyArray<string>
  root?: string
  retryInterval?: number
  heartbeatInterval?: number
  /**
   * Number of pool sessions this agent serves. The saved studio config is shared by all of them,
   * so it is only persisted and replayed when this is 1.
   */
  poolSize?: number
  /**
   * Aborting this disconnects the session and stops the reconnect loop. Hosts wire it to their own
   * shutdown: Nitro's `close` hook, or `SIGINT`/`SIGTERM` in the CLI.
   */
  signal?: AbortSignal
}

/**
 * Schedules another connection attempt.
 *
 * Hoisted out of `connectToStudio` on purpose: a pending retry timer reaches its whole enclosing
 * scope, so keeping it inside would pin the closed socket, the hook emitter, and the session id
 * alive for the length of every retry interval.
 */
function reconnect(options: ConnectToStudioOptions): void {
  const { signal, retryInterval = agentDefaults.retryIntervalMs } = options

  if (signal?.aborted) {
    return
  }

  logger.info(`Retrying connection in ${retryInterval}ms to Kubb Studio ...`)

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
      logger.error(`Reconnect attempt to Kubb Studio failed: ${getErrorMessage(error)}`)

      // A rejected token stays rejected, so retrying only spams 401s until the process is killed.
      if (error instanceof InvalidAgentTokenError) {
        return
      }

      reconnect(options)
    })
  }, retryInterval)

  signal?.addEventListener('abort', cancel, { once: true })
}

export async function connectToStudio(options: ConnectToStudioOptions): Promise<void> {
  const {
    token,
    studioUrl = agentDefaults.studioUrl,
    configPath,
    loadConfig,
    version,
    client,
    // Every permission is off unless the host grants it.
    allowWrite = false,
    allowConfigEdit = false,
    allowInput = false,
    allowExec = false,
    allowedPlugins,
    root = process.cwd(),
    heartbeatInterval: requestedHeartbeatInterval = agentDefaults.heartbeatIntervalMs,
    signal,
  } = options

  // Studio counts an agent offline once its last ping is older than its liveness window, so a
  // slower cadence would make a healthy agent invisible. Clamped here rather than in a host's env
  // parsing, so every host is held to the contract.
  const heartbeatInterval = Math.min(requestedHeartbeatInterval, agentDefaults.heartbeatIntervalMs)

  // Each connection gets its own isolated event emitter so generation events
  // from one session do not bleed into another session's WebSocket stream.
  const hooks = new Hookable<AgentHooks>()

  try {
    const { sessionId, slug, wsUrl, isSandbox } = await createAgentSession({ token, studioUrl })
    const ws = createWebsocket(wsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Slug is the readable connection identifier shared with Studio; fall back to a
    // generic tag (not a masked session id) when an older Studio didn't return one.
    const tag = slug ?? 'agent'

    // Effective permissions: always disabled in sandbox mode
    const effectiveWrite = isSandbox ? false : allowWrite
    // A sandbox has no user project to edit, so a config edit is never granted there.
    const effectiveConfigEdit = isSandbox ? false : allowConfigEdit
    // `configPath` is relative to the agent's root unless it is already absolute, which is what
    // `resolve` does on its own.
    const configFilePath = path.resolve(root, configPath)
    // A sandbox agent always generates from the spec Studio supplies; a local agent only when opted in.
    const effectiveAllowInput = isSandbox || allowInput
    // Tracks whether the studio server explicitly disconnected us (no reconnect needed)
    let serverDisconnected = false
    // Guards against a second `generate` command starting while one is already running.
    // Without this, two concurrent `generate()` calls share this socket via `setupEventsStream`,
    // and their events interleave with no way for Studio to tell the two runs apart.
    let isGenerating = false
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined
    // Tracks socket liveness: Studio replies to every ping with a pong. When pongs stop
    // arriving the connection is half-open (e.g. dropped during a Studio deploy) and must
    // be terminated so the reconnect loop can establish a fresh session.
    let lastPongAt = Date.now()

    const onAbort = () => void teardown({ reason: 'shutdown', retry: false })

    function cleanup(reason = 'cleanup') {
      clearInterval(heartbeatTimer)
      heartbeatTimer = undefined

      // This connection is over, so its shutdown listener must go with it. Otherwise every
      // reconnect leaves one behind on a signal that only fires at process exit.
      signal?.removeEventListener('abort', onAbort)

      hooks.removeAllHooks()

      try {
        ws.close(1000, reason)
      } catch {}

      ws.removeEventListener('open', onOpen)
      ws.removeEventListener('close', onClose)
      ws.removeEventListener('error', onError)
      ws.removeEventListener('message', onMessage)
    }

    /**
     * Reads `kubb.config.ts` and reports which plugin options Studio may edit.
     *
     * Skipped when the host did not grant `allowConfigEdit`. The patcher pulls in `ts-morph`
     * (~130ms, ~100MB RSS), so read-only agents never import it.
     *
     * Not cached — the user can edit the file between two Studio actions.
     */
    async function readConfigFileView(source?: string): Promise<ConfigFileView | undefined> {
      if (!effectiveConfigEdit) {
        return undefined
      }

      try {
        const { readConfig } = await import('./configFile.ts')

        return readConfig(source ?? (await readFile(configFilePath, 'utf-8')))
      } catch (error) {
        logger.debug(tag, `Could not read ${configFilePath}: ${getErrorMessage(error)}`)

        return undefined
      }
    }

    async function sendConnectedPayload() {
      const config = await loadConfig()

      sendAgentMessage(ws, {
        type: 'connected',
        payload: {
          versions: {
            kubb: kubbVersion,
            agent: version,
          },
          configPath,
          root,
          client,
          permissions: {
            allowWrite: effectiveWrite,
            allowInput: effectiveAllowInput,
            allowExec,
            allowConfigEdit: effectiveConfigEdit,
          },
          configFile: await readConfigFileView(),
          config: {
            plugins: config.plugins.map((plugin) => ({
              name: `@kubb/${plugin.name}`,
              // Functions and symbols in plugin options are dropped by `JSON.stringify` on the way out.
              options: plugin.options ?? {},
            })),
          },
        },
      })
    }

    const onOpen = () => {
      lastPongAt = Date.now()
      logger.success(tag, 'Connected to Kubb Studio')

      // Announce readiness without waiting for a `connect` command. The command from the
      // Studio UI is lost when it is sent while the agent is not attached to the session
      // (e.g. reconnecting after a deploy), so the agent introduces itself on every open.
      sendConnectedPayload().catch((error: unknown) => {
        logger.warn(tag, 'Failed to send connected payload on open', { error: getErrorMessage(error) })
      })
    }

    /**
     * Drops the socket and tells Studio the session is over. `serverDisconnected` guards against
     * the close event running this a second time, and against a shutdown reconnecting.
     */
    async function teardown({ reason, retry }: { reason?: string; retry: boolean }) {
      if (serverDisconnected) {
        return
      }
      serverDisconnected = true

      cleanup(reason)
      // Already tearing down, so a failed disconnect changes nothing.
      await disconnect({ sessionId, studioUrl, token, slug }).catch(() => {})

      if (retry) {
        reconnect(options)
      }
    }

    const onClose = () => teardown({ retry: true })

    const onError = () => {
      logger.error(tag, 'Failed to connect to Kubb Studio')

      return onClose()
    }

    ws.addEventListener('open', onOpen)
    ws.addEventListener('close', onClose)
    ws.addEventListener('error', onError)
    // The socket's own close event fires after this, and `teardown` is idempotent, so the shutdown
    // path cannot be turned into a reconnect by the close that follows it.
    signal?.addEventListener('abort', onAbort, { once: true })

    heartbeatTimer = setInterval(() => {
      // Two consecutive missed pongs mean the socket is dead even though no close event
      // arrived. Terminate (not close) so a half-open TCP connection can't linger — the
      // resulting close event triggers cleanup and the reconnect loop.
      if (Date.now() - lastPongAt > heartbeatInterval * 2) {
        logger.warn(tag, 'No pong received from Kubb Studio, terminating stale connection')
        // Stop the timer here rather than waiting for cleanup() — the close event can lag,
        // and until it runs this interval would re-terminate and re-log every tick.
        clearInterval(heartbeatTimer)
        heartbeatTimer = undefined
        ws.terminate()

        return
      }

      sendAgentMessage(ws, { type: 'ping' })
    }, heartbeatInterval)

    // Only `kubb:error` is ever fired on the connection emitter — every generation event goes
    // through its own emitter below — so it gets that one listener rather than the full stream.
    hooks.hook('kubb:error', ({ error }) => sendErrorMessage(ws, error))

    const onMessage = async (message: WebSocket.MessageEvent) => {
      try {
        const data = JSON.parse(message.data as string) as AgentMessage

        logger.debug(tag, `Received "${data.type}" from Studio`)

        if (isPongMessage(data)) {
          lastPongAt = Date.now()

          return
        }

        if (isDisconnectMessage(data)) {
          logger.warn(tag, `Agent session disconnected by Studio (${data.reason})`)

          if (data.reason === 'revoked') {
            cleanup(`session_${data.reason}`)
            return
          }

          if (data.reason === 'expired') {
            cleanup()
            reconnect(options)

            return
          }

          return
        }

        if (isCommandMessage(data)) {
          if (data.command === 'generate') {
            if (isGenerating) {
              logger.warn(tag, 'Ignored "generate" command from Studio: a generation is already in progress')

              await Promise.resolve(
                hooks.callHook('kubb:error', { error: new Error('A generation is already in progress, please wait for it to finish') }),
              ).catch(() => {})

              return
            }

            isGenerating = true

            try {
              const config = await loadConfig()
              const patch = data.payload
              assertAllowedPlugins(patch?.plugins, allowedPlugins)

              const plugins = await mergePlugins(config.plugins, patch?.plugins, patch?.disabledPlugins)
              const adapter = await mergeAdapter(config.adapter, patch?.adapter)

              // A sandbox agent always uses the inline spec (empty string included, since it has no disk
              // file); a local agent only when opted in, and an empty or absent spec falls back to disk.
              const inputOverride = isSandbox ? (patch?.input ?? '') : (allowInput && patch?.input) || undefined

              if (allowWrite && isSandbox) {
                logger.warn(tag, 'Agent is running in a sandbox environment, write will be disabled')
              }

              if (patch?.input && !effectiveAllowInput) {
                logger.warn(tag, 'Input from Studio is ignored; set KUBB_AGENT_ALLOW_INPUT=true to generate from the spec sent by Studio')
              }

              const generationHooks = new Hookable<AgentHooks>()
              setupHookListener(generationHooks, root)
              setupEventsStream(ws, generationHooks)

              await generate({
                config: {
                  ...config,
                  root,
                  input: inputOverride ?? config.input,
                  storage: effectiveWrite ? fsStorage() : memoryStorage(),
                  output: allowExec ? { ...config.output } : { ...config.output, format: false, lint: false, postGenerate: [] },
                  plugins: plugins ?? config.plugins,
                  adapter,
                },
                hooks: generationHooks,
              })

              logger.success(tag, `Completed "${data.type}" from Studio`)
            } finally {
              isGenerating = false
            }

            return
          }

          if (data.command === 'connect') {
            await sendConnectedPayload()

            logger.success(tag, `Completed "${data.type}" from Studio`)

            return
          }

          if (data.command === 'save') {
            // Studio waits on a `config-saved` for every `save`, so every path out of this
            // branch sends one. `edits` is checked before it is walked: the message crosses the same
            // trust boundary as the values inside it.
            if (!Array.isArray(data.edits)) {
              logger.warn(tag, 'Ignored "save" from Studio: the message carried no edits')

              sendAgentMessage(ws, { type: 'config-saved', payload: { outcomes: [], changed: false } })

              return
            }

            const edits = data.edits
            const refuse = (reason: string) =>
              sendAgentMessage(ws, {
                type: 'config-saved',
                payload: { outcomes: edits.map((edit) => ({ edit, applied: false, reason })), changed: false },
              })

            if (!effectiveConfigEdit) {
              logger.warn(tag, 'Ignored "save" from Studio: editing kubb.config.ts was not granted')

              refuse('the agent was not granted permission to edit kubb.config.ts')

              return
            }

            // A generation reloads the config while it runs, so rewriting the file underneath it
            // would leave that run working from half the change.
            if (isGenerating) {
              refuse('a generation is in progress')

              return
            }

            try {
              // Read straight before the patch rather than reusing what went out on connect. The user
              // may have edited the file since, and since every untouched node keeps its own text,
              // patching what is on disk right now preserves that edit.
              const { applyConfigEdits } = await import('./configFile.ts')
              const current = await readFile(configFilePath, 'utf-8')
              const { source: patched, outcomes, changed } = applyConfigEdits(current, edits)

              if (changed) {
                await writeFile(configFilePath, patched, 'utf-8')
              }

              sendAgentMessage(ws, {
                type: 'config-saved',
                payload: { outcomes, changed, configFile: changed ? await readConfigFileView(patched) : undefined },
              })

              const applied = outcomes.filter((outcome) => outcome.applied).length
              logger.success(tag, `Completed "${data.type}" from Studio, applied ${applied}/${outcomes.length} edits to ${configPath}`)
            } catch (error) {
              // An unreadable config, a read-only filesystem. Reported as a refusal of every edit so
              // Studio hears back rather than waiting on a reply that never comes.
              logger.exception(tag, error)

              refuse(getErrorMessage(error))
            }

            return
          }
        }

        logger.warn(tag, 'Unknown message type from Kubb Studio', { message: String(message.data) })
      } catch (error) {
        logger.exception(tag, error)

        // Errors thrown before `generate()` runs (e.g. config loading, plugin resolution)
        // never reach `generate()`'s own `kubb:error` emission, so without this the Studio
        // UI shows nothing while the agent silently fails. Forward them on the connection-level
        // `hooks` emitter, already wired to this socket via `setupEventsStream`.
        await Promise.resolve(hooks.callHook('kubb:error', { error: error instanceof Error ? error : new Error(String(error)) })).catch(() => {})
      }
    }
    ws.addEventListener('message', onMessage)
  } catch (error) {
    // Reaching here means the session was never created (Studio down, a 502 mid-deploy), so no
    // socket exists and none of the socket-driven reconnect paths can fire. Retry from here or the
    // slot is dropped for the lifetime of the process.
    logger.error(`Failed to open a Kubb Studio session: ${getErrorMessage(error)}`)

    if (error instanceof InvalidAgentTokenError) {
      throw error
    }

    reconnect(options)
  }
}
