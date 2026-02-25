import path from 'node:path'
import process from 'node:process'
import type { KubbEvents } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'
import { registerAgent } from '~/utils/api.ts'
import { connectToStudio } from '~/utils/connectStudio.ts'
import { getSessionKey } from '~/utils/getSessionKey.ts'
import type { AgentSession } from '~/utils/isSessionValid.ts'
import { logger } from '~/utils/logger.ts'

/**
 * Nitro plugin that connects the agent to Kubb Studio on server startup.
 *
 * When `KUBB_AGENT_TOKEN` and `KUBB_STUDIO_URL` are set, it:
 * 1. Loads the Kubb config referenced by `KUBB_AGENT_CONFIG`.
 * 2. Obtains a WebSocket session from Studio (using the session cache when available).
 * 3. Opens a persistent WebSocket and registers handlers for `generate` and `connect` commands.
 * 4. Forwards Kubb generation lifecycle events to Studio in real time.
 * 5. Sends a ping every 30 seconds to keep the connection alive.
 * 6. Gracefully disconnects when the Nitro server closes.
 */
export default defineNitroPlugin(async (nitro) => {
  const studioUrl = process.env.KUBB_STUDIO_URL || 'https://studio.kubb.dev'
  const token = process.env.KUBB_AGENT_TOKEN
  const configPath = process.env.KUBB_AGENT_CONFIG || 'kubb.config.ts'
  const noCache = process.env.KUBB_AGENT_NO_CACHE === 'true'
  const retryInterval = process.env.KUBB_AGENT_RETRY_TIMEOUT ? Number.parseInt(process.env.KUBB_AGENT_RETRY_TIMEOUT, 10) : 30000
  const heartbeatInterval = process.env.KUBB_AGENT_HEARTBEAT_INTERVAL ? Number.parseInt(process.env.KUBB_AGENT_HEARTBEAT_INTERVAL, 10) : 30_000
  const root = process.env.KUBB_AGENT_ROOT || process.cwd()
  const allowAll = process.env.KUBB_AGENT_ALLOW_ALL === 'true'
  const allowWrite = allowAll || process.env.KUBB_AGENT_ALLOW_WRITE === 'true'

  if (!token) {
    logger.warn('KUBB_AGENT_TOKEN not set', 'cannot authenticate with studio')

    return null
  }

  if (!studioUrl) {
    logger.warn('KUBB_STUDIO_URL not set', 'skipping studio connection')

    return null
  }

  const resolvedConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(root, configPath)
  const events = new AsyncEventEmitter<KubbEvents>()
  const storage = useStorage<AgentSession>('kubb')
  const sessionKey = getSessionKey(token)

  try {
    await registerAgent({ token, studioUrl })
    await connectToStudio({
      token,
      studioUrl,
      configPath,
      resolvedConfigPath,
      noCache,
      allowAll,
      allowWrite,
      root,
      retryInterval,
      heartbeatInterval,
      events,
      storage,
      sessionKey,
      nitro,
    })
  } catch (error: any) {
    logger.error('Failed to connect to Kubb Studio\n', (error as Error).message)
  }
})
