import type { KubbEvents } from '@kubb/core'
import { AsyncEventEmitter, formatMs, serializePluginOptions } from '@kubb/core/utils'
import type { NitroApp } from 'nitropack/types'
import { version } from '~~/package.json'
import { type AgentConnectResponse, type AgentMessage, isCommandMessage, isDisconnectMessage, isPongMessage } from '../types/agent.ts'
import { removeCachedSession, saveStudioConfigToStorage } from './agentCache.ts'
import { createAgentSession, disconnect } from './api.ts'
import { generate } from './generate.ts'
import { loadConfig } from './loadConfig.ts'
import { logger } from './logger.ts'
import { maskedString } from './maskedString.ts'
import { mergePlugins } from './mergePlugins.ts'
import { setupHookListener } from './setupHookListener.ts'
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
    sessionKey,
    nitro,
  } = options

  // Each connection gets its own isolated event emitter so generation events
  // from one session do not bleed into another session's WebSocket stream.
  const events = new AsyncEventEmitter<KubbEvents>()
  const maskedSessionKey = maskedString(sessionKey.replace('sessions:', ''))

  async function removeSession() {
    if (!noCache) {
      await removeCachedSession(sessionKey)
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

    const { sessionId, wsUrl, isSandbox } = initialSession ?? (await createAgentSession({ noCache, token, studioUrl, cacheKey: sessionKey }))
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

      await disconnect({ sessionId, studioUrl, token }).catch(() => {
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
      await disconnect({ sessionId, studioUrl, token }).catch(() => {
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

            // Message payload takes priority over previously saved studio config
            const patch = data.payload
            const plugins = mergePlugins(config.plugins, patch?.plugins)

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

            if (data.payload && effectiveWrite) {
              await saveStudioConfigToStorage({ sessionKey, config: data.payload }).catch((err) => {
                logger.warn(`[${maskedSessionKey}] Failed to save studio config: ${err?.message}`)
              })
            }

            await generate({
              config: {
                ...config,
                root,
                input: inputOverride ?? config.input,
                output: { ...config.output, write: effectiveWrite },
                plugins,
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
                  plugins: config.plugins?.map((plugin) => ({
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
