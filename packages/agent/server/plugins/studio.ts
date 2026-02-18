import process from 'node:process'
import { type KubbEvents, LogLevel } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { AgentMessage } from '~/types/agent.ts'
import { connect, disconnect } from '~/utils/api.ts'
import { getConfigs } from '~/utils/getConfigs.ts'
import { getCosmiConfig } from '~/utils/getCosmiConfig.ts'
import { logger } from '~/utils/logger.ts'
import { createWebsocket, sendConnectedMessage, sendPingMessage, setupEventsStream } from '~/utils/ws.ts'
import { getCachedSession, deleteCachedSession } from '~/utils/sessionManager.ts'

export default defineNitroPlugin(async (nitro) => {
  // Connect to Kubb Studio if URL is provided
  const studioUrl = process.env.KUBB_STUDIO_URL || 'https://studio.kubb.dev'
  const token = process.env.KUBB_AGENT_TOKEN
  const configPath = process.env.KUBB_CONFIG || 'kubb.config.ts'
  const noCache = process.env.KUBB_AGENT_NO_CACHE === 'true'

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
  const configs = await getConfigs(result)

  if (configs.length === 0) {
    throw new Error('No configs found')
  }

  // Use first config
  const config = configs[0]
  const events = new AsyncEventEmitter<KubbEvents>()
  const logLevel = LogLevel.info
  const wsOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  const root = process.env.KUBB_ROOT || config.root || process.cwd()

  const { sessionToken, wsUrl } = await connect({ noCache, token, studioUrl })

  const onError = () => {
    const cachedSession = !noCache ? getCachedSession(token) : null

    // If connection fails and we used cached session, invalidate it
    if (cachedSession) {
      logger.warn('Invalidating cached session', 'due to connection error')
      deleteCachedSession(token)
    }
  }

  const onClose = async () => {
    logger.info('Disconnecting from Studio...')

    if (sessionToken) {
      await disconnect({
        sessionToken,
        studioUrl,
        token,
      })
    }
  }

  const ws = await createWebsocket(wsUrl, wsOptions)

  ws.addEventListener('close', onClose)
  ws.addEventListener('error', onError)

  nitro.hooks.hook('close', onClose)

  setInterval(() => {
    sendPingMessage(ws)
  }, 30000)

  setupEventsStream(ws, events)

  //listen
  ws.addEventListener('message', async (message) => {
    const data = JSON.parse(message.data) as AgentMessage

    switch (data.type) {
      case 'command':
        if (data.command === 'generate') {
          await generate({
            root,
            config,
            events,
            logLevel,
          })
          logger.success('Generated command success')
        }

        if (data.command === 'connect') {
          sendConnectedMessage(ws, { config })
        }
        break

      default:
        logger.warn('Unknown message type from Kubb Studio')
    }
  })
})
