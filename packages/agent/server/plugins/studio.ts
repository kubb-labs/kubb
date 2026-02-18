import process from 'node:process'
import { type KubbEvents, LogLevel } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import type { AgentMessage } from '~/types/agent.ts'
import { connect, disconnect } from '~/utils/api.ts'
import { getConfigs } from '~/utils/getConfigs.ts'
import { getCosmiConfig } from '~/utils/getCosmiConfig.ts'
import { createWebsocket, sendConnectedMessage, sendPingMessage, setupEventsStream } from '~/utils/ws.ts'

export default defineNitroPlugin(async (nitro) => {
  // Connect to Kubb Studio if URL is provided
  const studioUrl = process.env.KUBB_STUDIO_URL
  const token = process.env.KUBB_AGENT_TOKEN
  const configPath = process.env.KUBB_CONFIG
  const noCache = process.env.KUBB_AGENT_NO_CACHE === 'true'

  if (!configPath) {
    throw new Error('KUBB_CONFIG environment variable not set')
  }

  if (!token) {
    console.warn('KUBB_AGENT_TOKEN not set, cannot authenticate with studio')

    return null
  }

  if (!studioUrl) {
    console.warn('KUBB_STUDIO_URL not set, skipping studio connection')

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

  const { sessionToken, wsUrl } = await connect({ noCache, token, studioUrl })

  const onError = () => {
    const cachedSession = !noCache ? getCachedSession(token) : null

    // If connection fails and we used cached session, invalidate it
    if (cachedSession) {
      console.warn('Invalidating cached session due to connection error')
      deleteCachedSession(token)
    }
  }

  const onClose = async () => {
    console.log('Disconnecting from Studio...')

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
  sendConnectedMessage(ws, { config })

  //listen
  ws.addEventListener('message', async (event) => {
    const data = JSON.parse(event.data) as AgentMessage

    switch (data.type) {
      case 'command':
        if (data.command === 'generate') {
          console.log('Generated command')
          await generate({
            config,
            events,
            logLevel,
          })
          console.log('Generated command success')
          // Handle generate command if needed
        }
        break

      default:
        console.warn('Unknown message type from Kubb Studio:', data)
    }
  })
})
