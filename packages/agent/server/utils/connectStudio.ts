import type { KubbEvents } from '@kubb/core'
import { AsyncEventEmitter, formatMs, serializePluginOptions } from '@kubb/core/utils'
import type { NitroApp } from 'nitropack/types'
import type { Storage } from 'unstorage'
import { version } from '~~/package.json'
import { type AgentConnectResponse, type AgentMessage, isCommandMessage, isDisconnectMessage, isPongMessage } from '../types/agent.ts'
import { createAgentSession, disconnect } from './api.ts'
import { generate } from './generate.ts'
import type { AgentSession } from './isSessionValid.ts'
import { loadConfig } from './loadConfig.ts'
import { logger } from './logger.ts'
import { maskedString } from './maskedString.ts'
import { resolvePlugins } from './resolvePlugins.ts'
import { setupHookListener } from './setupHookListener.ts'
import { readStudioConfig, writeStudioConfig } from './studioConfig.ts'
import { createWebsocket, sendAgentMessage, setupEventsStream } from './ws.ts'

export type ConnectToStudioOptions = {
  token: string
  studioUrl: string
  configPath: string
  resolvedConfigPath: string
  noCache: boolean
  allowAll: boolean
  allowWrite: boolean
  root: string
  retryInterval: number
  heartbeatInterval?: number
  /** Pre-created session to use instead of calling createAgentSession. Only used on the first connect, not on reconnects. */
  initialSession?: AgentConnectResponse
  storage: Storage<AgentSession>
  sessionKey: string
  nitro: NitroApp
}

/**
 * Opens a WebSocket connection to Kubb Studio and handles incoming commands.
 * Automatically reconnects after `retryInterval` ms on close or error.
 */
export async function connectToStudio(options: ConnectToStudioOptions): Promise<void> {
  const {
    token,
    studioUrl,
    configPath,
    resolvedConfigPath,
    noCache,
    allowAll,
    allowWrite,
    root,
    retryInterval,
    heartbeatInterval = 30_000,
    initialSession,
    storage,
    sessionKey,
    nitro,
  } = options

  // Each connection gets its own isolated event emitter so generation events
  // from one session do not bleed into another session's WebSocket stream.
  const events = new AsyncEventEmitter<KubbEvents>()
  const maskedSessionKey = maskedString(sessionKey)

  async function removeSession() {
    const agentSession = await storage.getItem(sessionKey)

    if (!noCache && agentSession) {
      logger.info(`[${maskedSessionKey}] Removing expired agent session from cache...`)

      await storage.removeItem(sessionKey)

      logger.success(`[${maskedSessionKey}] Removed expired agent session from cache`)
    }
  }

  async function reconnect() {
    logger.info(`[${maskedSessionKey}] Retrying connection in ${formatMs(retryInterval)} to Kubb Studio ...`)

    await removeSession()

    // On reconnect, don't reuse the initial session — always create a fresh one
    setTimeout(() => connectToStudio({ ...options, initialSession: undefined }), retryInterval)
  }

  try {
    setupHookListener(events, root)

    const { sessionToken, wsUrl, isSandbox } = initialSession ?? (await createAgentSession({ noCache, token, studioUrl, storage, cacheKey: sessionKey }))
    const ws = createWebsocket(wsUrl, { headers: { Authorization: `Bearer ${token}` } })
    const maskedWsUrl = maskedString(wsUrl)

    // Effective permissions: always disabled in sandbox mode
    const effectiveAllowAll = isSandbox ? false : allowAll
    const effectiveWrite = isSandbox ? false : allowWrite

    // Tracks whether the studio server explicitly disconnected us (no reconnect needed)
    let serverDisconnected = false
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined

    async function cleanup(reason = 'cleanup') {
      try {
        clearInterval(heartbeatTimer)
        heartbeatTimer = undefined

        events.removeAll()

        ws.close(1000, reason)
        ws.removeEventListener('open', onOpen)
        ws.removeEventListener('close', onClose)
        ws.removeEventListener('error', onError)
      } catch (_error: any) {}
    }

    const onOpen = () => {
      logger.success(`[${maskedSessionKey}] Connected to Kubb Studio on "${maskedWsUrl}"`)
    }

    const onClose = async () => {
      if (serverDisconnected) {
        return
      }

      serverDisconnected = true

      // first cleanup the event listeners and then connect again
      await cleanup()

      await disconnect({ sessionToken, studioUrl, token }).catch(() => {
        // Ignore disconnect errors since we're already handling a closed connection
      })

      await reconnect()
    }

    const onError = async () => {
      logger.error(`[${maskedSessionKey}] Failed to connect to Kubb Studio on "${maskedWsUrl}"`)

      // first cleanup the event listeners and then connect again
      await cleanup()
      await reconnect()
    }

    ws.addEventListener('open', onOpen)
    ws.addEventListener('close', onClose)
    ws.addEventListener('error', onError)
    nitro.hooks.hook('close', async () => {
      await cleanup()
      await disconnect({ sessionToken, studioUrl, token }).catch(() => {
        // Ignore disconnect errors since we're already handling a closed connection
      })
    })

    heartbeatTimer = setInterval(() => sendAgentMessage(ws, { type: 'ping' }), heartbeatInterval)

    setupEventsStream(ws, events)

    ws.addEventListener('message', async (message) => {
      try {
        const data = JSON.parse(message.data as string) as AgentMessage

        logger.info(`[${maskedSessionKey}] Received "${data.type}" from Studio`)

        if (isPongMessage(data)) {
          return
        }

        if (isDisconnectMessage(data)) {
          logger.warn(`[${maskedSessionKey}] Agent session disconnected by Studio with reason: ${data.reason}`)

          if (data.reason === 'revoked') {
            await cleanup(`session_${data.reason}`)

            await removeSession()
            return
          }

          if (data.reason === 'expired') {
            // first cleanup the event listeners and then connect again
            await cleanup()
            await reconnect()

            return
          }

          return
        }

        if (isCommandMessage(data)) {
          if (data.command === 'generate') {
            const config = await loadConfig(resolvedConfigPath)

            // Message payload takes priority over the persisted studio config
            const patch = data.payload ?? readStudioConfig(resolvedConfigPath)
            const resolvedPlugins = patch?.plugins ? resolvePlugins(patch.plugins) : undefined

            // In sandbox mode the caller may supply raw OpenAPI / Swagger spec
            // content inline (YAML or JSON string) via `payload.input`.
            // Outside of sandbox mode the input is always taken from the config
            // file on disk — ignoring any payload-supplied input for security.
            const inputOverride = isSandbox ? { data: patch?.input ?? '' } : undefined

            if (allowWrite && isSandbox) {
              logger.warn(`[${maskedSessionKey}] Agent is running in a sandbox environment, write will be disabled`)
            }

            if (patch?.input && !isSandbox) {
              logger.warn(`[${maskedSessionKey}] Input override via payload is only supported in sandbox mode and will be ignored`)
            }

            if (effectiveWrite && data.payload) {
              writeStudioConfig(resolvedConfigPath, data.payload)
            }

            await generate({
              config: {
                ...config,
                input: inputOverride ?? config.input,
                plugins: resolvedPlugins ?? config.plugins,
                root,
                output: { ...config.output, write: effectiveWrite },
              },
              events,
            })

            logger.success(`[${maskedSessionKey}] Completed "${message.type}" from Studio`)

            return
          }

          if (data.command === 'connect') {
            const config = await loadConfig(resolvedConfigPath)

            sendAgentMessage(ws, {
              type: 'connected',
              payload: {
                version,
                configPath,
                permissions: { allowAll: effectiveAllowAll, allowWrite: effectiveWrite },
                config: {
                  plugins: config.plugins?.map((plugin: any) => ({
                    name: `@kubb/${plugin.name}`,
                    options: serializePluginOptions(plugin.options),
                  })),
                },
              },
            })

            logger.success(`[${maskedSessionKey}] Completed "${message.type}" from Studio`)

            return
          }
        }

        logger.warn(`[${maskedSessionKey}] Unknown message type from Kubb Studio: ${message.data}`)
      } catch (error: any) {
        logger.error(`[${maskedSessionKey}] [unhandledRejection] ${error?.message ?? error}`)
      }
    })
  } catch (error: any) {
    throw new Error(`[unhandledRejection] ${error?.message ?? error}`, { cause: error })
  }
}
