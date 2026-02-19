import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { KubbEvents } from '@kubb/core'
import { AsyncEventEmitter, formatMs, getConfigs, serializePluginOptions } from '@kubb/core/utils'
import { execa } from 'execa'
import { type AgentMessage, isCommandMessage } from '~/types/agent.ts'
import { createAgentSession, disconnect } from '~/utils/api.ts'
import { generate } from '~/utils/generate.ts'
import { getCosmiConfig } from '~/utils/getCosmiConfig.ts'
import { logger } from '~/utils/logger.ts'
import { deleteCachedSession, getCachedSession } from '~/utils/sessionManager.ts'
import { createWebsocket, sendAgentMessage, setupEventsStream } from '~/utils/ws.ts'
import { version } from '~~/package.json'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string
      KUBB_ROOT: string
      KUBB_STUDIO_URL: string
      KUBB_AGENT_TOKEN: string
      KUBB_CONFIG: string
      KUBB_AGENT_NO_CACHE: string
      KUBB_RETRY_TIMEOUT: string
    }
  }
}

/**
 * Nitro plugin that connects the agent to Kubb Studio on server startup.
 *
 * When `KUBB_AGENT_TOKEN` and `KUBB_STUDIO_URL` are set, it:
 * 1. Loads the Kubb config referenced by `KUBB_CONFIG`.
 * 2. Obtains a WebSocket session from Studio (using the session cache when available).
 * 3. Opens a persistent WebSocket and registers handlers for `generate` and `connect` commands.
 * 4. Forwards Kubb generation lifecycle events to Studio in real time.
 * 5. Sends a ping every 30 seconds to keep the connection alive.
 * 6. Gracefully disconnects when the Nitro server closes.
 */
export default defineNitroPlugin(async (nitro) => {
  // Connect to Kubb Studio if URL is provided
  const studioUrl = process.env.KUBB_STUDIO_URL || 'https://studio.kubb.dev'
  const token = process.env.KUBB_AGENT_TOKEN
  const configPath = process.env.KUBB_CONFIG || 'kubb.config.ts'
  const noCache = process.env.KUBB_AGENT_NO_CACHE === 'true'
  const retryInterval = process.env.KUBB_RETRY_TIMEOUT ? Number.parseInt(process.env.KUBB_RETRY_TIMEOUT, 10) : 30000

  if (!configPath) {
    throw new Error('KUBB_CONFIG environment variable not set')
  }

  if (!token) {
    logger.warn('KUBB_AGENT_TOKEN not set', 'cannot authenticate with studio')

    return null
  }

  if (!studioUrl) {
    logger.warn('KUBB_STUDIO_URL not set', 'skipping studio connection')

    return null
  }

  // Load config
  const result = await getCosmiConfig(configPath)
  const configs = await getConfigs(result.config, {})

  if (configs.length === 0) {
    throw new Error('No configs found')
  }

  // Use first config
  const config = configs[0]
  const events = new AsyncEventEmitter<KubbEvents>()
  const wsOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  const root = process.env.KUBB_ROOT || config.root || process.cwd()

  events.on('hook:start', async ({ id, command, args }) => {
    const commandWithArgs = args?.length ? `${command} ${args.join(' ')}` : command

    // Skip hook execution if no id is provided (e.g., during benchmarks or tests)
    if (!id) {
      return
    }

    try {
      const result = await execa(command, args, {
        cwd: root,
        detached: true,
        stripFinalNewline: true,
      })

      console.log(result.stdout)

      await events.emit('hook:end', {
        command,
        args,
        id,
        success: true,
        error: null,
      })
    } catch (_err) {
      const errorMessage = new Error(`Hook execute failed: ${commandWithArgs}`)

      await events.emit('hook:end', {
        command,
        args,
        id,
        success: false,
        error: errorMessage,
      })
      await events.emit('error', errorMessage)
    }
  })

  async function reconnectToStudio() {
    logger.info(`Retrying connection in ${formatMs(retryInterval)} to Kubb Studio ...`)

    setTimeout(async () => {
      await connectToStudio()
    }, retryInterval)
  }

  async function connectToStudio() {
    try {
      // start connection to studio
      const { sessionToken, wsUrl } = await createAgentSession({ noCache, token, studioUrl })
      const ws = createWebsocket(wsUrl, wsOptions)

      const onError = async () => {
        cleanup()

        logger.error(`Failed to connect to Kubb Studio on "${wsUrl}"`)

        const cachedSession = !noCache ? getCachedSession(token) : null

        // If connection fails and we used cached session, invalidate it
        if (cachedSession) {
          deleteCachedSession(token)
          await reconnectToStudio()
        }
      }

      const onOpen = () => {
        logger.success(`Connected to Kubb Studio on "${wsUrl}"`)
      }

      const onClose = async () => {
        cleanup()

        logger.info('Disconnecting from Studio ...')

        if (sessionToken) {
          await disconnect({
            sessionToken,
            studioUrl,
            token,
          }).catch(async () => {
            deleteCachedSession(token)
            await reconnectToStudio()
          })
        }
      }

      const cleanup = () => {
        ws.removeEventListener('open', onOpen)
        ws.removeEventListener('close', onClose)
        ws.removeEventListener('error', onError)
      }

      ws.addEventListener('open', onOpen)
      ws.addEventListener('close', onClose)
      ws.addEventListener('error', onError)

      nitro.hooks.hook('close', onClose)

      setInterval(() => {
        sendAgentMessage(ws, {
          type: 'ping',
        })
      }, 30000)

      setupEventsStream(ws, events)

      ws.addEventListener('message', async (message) => {
        const data = JSON.parse(message.data) as AgentMessage

        if (isCommandMessage(data)) {
          if (data.command === 'generate') {
            await generate({
              config: {
                ...config,
                root,
              },
              events,
            })
            logger.success('Generated command success')
          }

          if (data.command === 'connect') {
            // Read OpenAPI spec if available
            let specContent: string | undefined
            if (config && 'path' in config.input) {
              const specPath = path.resolve(process.cwd(), config.root, config.input.path)
              try {
                specContent = readFileSync(specPath, 'utf-8')
              } catch {
                // Spec file not found or unreadable
              }
            }

            sendAgentMessage(ws, {
              type: 'connected',
              payload: {
                version,
                configPath: process.env.KUBB_CONFIG || '',
                spec: specContent,
                config: {
                  name: config.name,
                  root: config.root,
                  input: {
                    path: 'path' in config.input ? config.input.path : undefined,
                  },
                  output: {
                    path: config.output.path,
                    write: config.output.write,
                    extension: config.output.extension,
                    barrelType: config.output.barrelType,
                  },
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
      })
    } catch (_error: any) {
      deleteCachedSession(token)
      await reconnectToStudio()
    }
  }

  await connectToStudio()
})
