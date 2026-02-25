import type { KubbEvents } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { formatMs, serializePluginOptions } from '@kubb/core/utils'
import type { NitroApp } from 'nitropack/types'
import type { Storage } from 'unstorage'
import { version } from '~~/package.json'
import { type AgentMessage, isCommandMessage, isDisconnectMessage, isPongMessage } from '../types/agent.ts'
import { createAgentSession, disconnect } from './api.ts'
import { generate } from './generate.ts'
import type { AgentSession } from './isSessionValid.ts'
import { loadConfig } from './loadConfig.ts'
import { logger } from './logger.ts'
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
  events: AsyncEventEmitter<KubbEvents>
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
    events,
    storage,
    sessionKey,
    nitro,
  } = options

  async function reconnect() {
    logger.info(`Retrying connection in ${formatMs(retryInterval)} to Kubb Studio ...`)

    setTimeout(() => connectToStudio(options), retryInterval)
  }

  try {
    // Remove all listeners to avoid duplicates on reconnect

    setupHookListener(events, root)

    const { sessionToken, wsUrl, isSandbox } = await createAgentSession({ noCache, token, studioUrl, storage })
    const ws = createWebsocket(wsUrl, { headers: { Authorization: `Bearer ${token}` } })

    // Effective permissions: always disabled in sandbox mode
    const effectiveAllowAll = isSandbox ? false : allowAll
    const effectiveWrite = isSandbox ? false : allowWrite

    // Tracks whether the studio server explicitly disconnected us (no reconnect needed)
    let serverDisconnected = false

    async function cleanup(reason = 'cleanup') {
      try {
        events.removeAll()
        await storage.removeItem(sessionKey)

        ws.close(1000, reason)
        ws.removeEventListener('open', onOpen)
        ws.removeEventListener('close', onClose)
        ws.removeEventListener('error', onError)
      } catch (_error: any) {}
    }

    const onOpen = () => {
      logger.success(`Connected to Kubb Studio on "${wsUrl}"`)
    }

    const onClose = async () => {
      if (serverDisconnected) {
        return
      }

      // first cleanup the event listeners and then connect again
      await cleanup()

      logger.info('Disconnecting from Studio ...')

      serverDisconnected = true

      await disconnect({ sessionToken, studioUrl, token }).catch(() => {
        // Ignore disconnect errors since we're already handling a closed connection
      })

      await reconnect()
    }

    const onError = async () => {
      logger.error(`Failed to connect to Kubb Studio on "${wsUrl}"`)

      // first cleanup the event listeners and then connect again
      await cleanup()
      await reconnect()
    }

    ws.addEventListener('open', onOpen)
    ws.addEventListener('close', onClose)
    ws.addEventListener('error', onError)
    nitro.hooks.hook('close', onClose)

    setInterval(() => sendAgentMessage(ws, { type: 'ping' }), heartbeatInterval)

    setupEventsStream(ws, events)

    ws.addEventListener('message', async (message) => {
      try {
        const data = JSON.parse(message.data as string) as AgentMessage

        if (isPongMessage(data)) {
          logger.info('Received pong from Studio')

          return
        }

        if (isDisconnectMessage(data)) {
          logger.warn(`Session ${data.reason} by Studio`)

          if (data.reason === 'revoked') {
            await cleanup(`session_${data.reason}`)

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
              logger.warn('Agent is running in a sandbox environment, write will be disabled')
            }

            if (patch?.input && !isSandbox) {
              logger.warn('Input override via payload is only supported in sandbox mode and will be ignored')
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

            logger.success('Generated command success')
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
          }

          return
        }

        logger.warn(`Unknown message type from Kubb Studio: ${message.data}`)
      } catch (error: any) {
        logger.error(`[unhandledRejection] ${error?.message ?? error}`)
      }
    })
  } catch (error: any) {
    throw new Error(`[unhandledRejection] ${error?.message ?? error}`, { cause: error })
  }
}
