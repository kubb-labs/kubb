import path from 'node:path'
import process from 'node:process'
import type { AgentConnectResponse } from '~/types/agent.ts'
import { getSessionKey } from '~/utils/agentCache.ts'
import { createAgentSession, registerAgent } from '~/utils/api.ts'
import { connectToStudio } from '~/utils/connectStudio.ts'
import { logger } from '~/utils/logger.ts'
import { maskedString } from '~/utils/maskedString.ts'

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
 *
 * The agent creates a pool of sessions (`KUBB_AGENT_POOL_SIZE`, default 1)
 * so each Studio user gets their own isolated WebSocket session.
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
  const poolSize = process.env.KUBB_AGENT_POOL_SIZE ? Number.parseInt(process.env.KUBB_AGENT_POOL_SIZE, 10) : 1

  if (!token) {
    logger.warn('KUBB_AGENT_TOKEN not set', 'cannot authenticate with studio')

    return null
  }

  if (!studioUrl) {
    logger.warn('KUBB_STUDIO_URL not set', 'skipping studio connection')

    return null
  }

  if (!process.env.KUBB_AGENT_SECRET) {
    logger.warn('KUBB_AGENT_SECRET not set', 'secret should be set')
  }

  const resolvedConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(root, configPath)
  const storage = useStorage<AgentSession>('kubb')
  const sessionKey = getSessionKey(token)
  const maskedSessionKey = maskedString(sessionKey.replace('sessions:', ''))

  try {
    await registerAgent({ token, studioUrl, poolSize })

    const baseOptions = {
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
      storage,
      sessionKey,
      nitro,
    }

    logger.info(`[${maskedSessionKey}] Starting session pool of ${poolSize} connection(s)`)

    const sessions = new Map<string, AgentConnectResponse | null>()
    for (const index of Array.from({ length: poolSize }, (_, i) => i)) {
      const cacheKey = `${sessionKey}-${index}`
      const maskedSessionKey = maskedString(cacheKey)
      const session = await createAgentSession({ noCache, token, studioUrl, cacheKey }).catch((err) => {
        logger.warn(`[${maskedSessionKey}] Failed to pre-create pool session:`, err?.message)
        return null
      })
      sessions.set(cacheKey, session)
    }

    let index = 0
    for (const [cacheKey, session] of sessions) {
      index++
      if (!session) {
        continue
      }
      const maskedSessionKey = maskedString(session.sessionId)

      logger.info(`[${maskedSessionKey}] Connecting session ${index}/${sessions.size}`)
      await connectToStudio({ ...baseOptions, initialSession: session, sessionKey: cacheKey }).catch((err: any) => {
        logger.warn(`[${maskedSessionKey}] Session ${index} failed to connect:`, err?.message)
      })
    }
  } catch (error: any) {
    logger.error('Failed to connect to Kubb Studio\n', (error as Error)?.message)
  }
})
