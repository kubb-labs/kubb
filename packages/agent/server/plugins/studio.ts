import path from 'node:path'
import process from 'node:process'
import { createAgentSession, registerAgent } from '~/utils/api.ts'
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
 *
 * In sandbox mode the agent creates a pool of sessions (`KUBB_AGENT_POOL_SIZE`, default 5)
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
  const poolSize = process.env.KUBB_AGENT_POOL_SIZE ? Number.parseInt(process.env.KUBB_AGENT_POOL_SIZE, 10) : 5

  if (!token) {
    logger.warn('KUBB_AGENT_TOKEN not set', 'cannot authenticate with studio')

    return null
  }

  if (!studioUrl) {
    logger.warn('KUBB_STUDIO_URL not set', 'skipping studio connection')

    return null
  }

  const resolvedConfigPath = path.isAbsolute(configPath) ? configPath : path.resolve(root, configPath)
  const storage = useStorage<AgentSession>('kubb')
  const sessionKey = getSessionKey(token)

  try {
    await registerAgent({ token, studioUrl })

    // Probe the first session to detect sandbox mode
    const firstSession = await createAgentSession({ noCache, token, studioUrl, storage })

    const baseOptions = {
      token,
      studioUrl,
      configPath,
      resolvedConfigPath,
      noCache: firstSession.isSandbox ? true : noCache,
      allowAll,
      allowWrite,
      root,
      retryInterval,
      heartbeatInterval,
      storage,
      sessionKey,
      nitro,
    }

    if (firstSession.isSandbox) {
      // In sandbox mode each Studio user gets their own isolated session.
      // The first session is already created; create the remaining pool slots in parallel.
      logger.info(`[sandbox] Starting session pool of ${poolSize} connections`)

      const remainingSessions = await Promise.all(
        Array.from({ length: poolSize - 1 }, () =>
          createAgentSession({ noCache: true, token, studioUrl, storage }).catch((err) => {
            logger.warn('[sandbox] Failed to pre-create pool session:', err?.message)
            return null
          }),
        ),
      )

      const allSessions = [firstSession, ...remainingSessions.filter(Boolean)]

      await Promise.all(
        allSessions.map((session, index) => {
          logger.info(`[sandbox] Connecting session ${index + 1}/${allSessions.length}`)
          return connectToStudio({ ...baseOptions, initialSession: session ?? undefined })
        }),
      )

      return
    }

    await connectToStudio({ ...baseOptions, initialSession: firstSession })
  } catch (error: any) {
    logger.error('Failed to connect to Kubb Studio\n', (error as Error)?.message)
  }
})
