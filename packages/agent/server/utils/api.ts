import type { AgentConnectResponse } from '~/types/agent.ts'
import { logger } from './logger.ts'
import { cacheSession, getCachedSession } from './sessionManager.ts'

type ConnectProps = {
  studioUrl: string
  token: string
  noCache?: boolean
}

/**
 * Connect the agent to Kubb Studio by obtaining a WebSocket session.
 * Attempts to reuse a cached session before making a network request.
 *
 */
export async function createAgentSession({ token, studioUrl, noCache }: ConnectProps): Promise<AgentConnectResponse> {
  // Try to use cached session first (unless --no-cache is set)
  const cachedSession = !noCache ? getCachedSession(token) : null
  if (cachedSession) {
    logger.success('Using cached agent session')

    return cachedSession
  }

  // Fetch new session from Studio
  const connectUrl = `${studioUrl}/api/agent/session/create`

  try {
    const data = await $fetch<AgentConnectResponse>(connectUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    // Cache the session for reuse (unless --no-cache is set)
    if (data && !noCache) {
      cacheSession(token, data)
    }

    if (!data) {
      throw new Error('No data available for agent session')
    }

    return data
  } catch (error: any) {
    throw new Error('Failed to get agent session from Kubb Studio', { cause: error })
  }
}

type DisconnectProps = {
  studioUrl: string
  token: string
  sessionToken: string
}

/**
 * Notify Kubb Studio that this agent is disconnecting.
 * Called on process termination or server close.
 *
 */
export async function disconnect({ sessionToken, token, studioUrl }: DisconnectProps): Promise<void> {
  try {
    const disconnectUrl = `${studioUrl}/api/agent/session/${sessionToken}/disconnect`
    await $fetch(disconnectUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    logger.success('Sent disconnect notification to Studio on exit')
  } catch (error: any) {
    throw new Error('Failed to notify Studio of disconnection on exit', { cause: error })
  }
}
