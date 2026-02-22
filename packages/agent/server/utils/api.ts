import type { AgentConnectResponse } from '~/types/agent.ts'
import { logger } from './logger.ts'
import { getMachineId } from './machineId.ts'
import { cacheSession, getCachedSession } from './cacheManager.ts'

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
      body: { machineId: getMachineId() },
    })

    // Cache the session for reuse (unless --no-cache is set)
    if (data && !noCache) {
      cacheSession(token, data)
    }

    if (!data) {
      throw new Error('No data available for agent session')
    }

    logger.success('Agent session created')

    return data
  } catch (error: any) {
    throw new Error('Failed to get agent session from Kubb Studio', { cause: error })
  }
}

type RegisterProps = {
  studioUrl: string
  token: string
}

/**
 * Register this agent with Kubb Studio by sending the machine ID.
 * Called once on agent startup before creating a WebSocket session.
 */
export async function registerAgent({ token, studioUrl }: RegisterProps): Promise<void> {
  const machineId = getMachineId()
  const registerUrl = `${studioUrl}/api/agent/register`

  try {
    await $fetch(registerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { machineId },
    })
    logger.success('Agent registered with Studio')
  } catch (error: any) {
    logger.warn('Failed to register agent with Studio', error?.cause?.message ?? error?.message)
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
