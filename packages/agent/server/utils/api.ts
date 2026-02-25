import type { Storage } from 'unstorage'
import type { AgentConnectResponse } from '~/types/agent.ts'
import { getSessionKey } from '~/utils/getSessionKey.ts'
import { type AgentSession, isSessionValid } from '~/utils/isSessionValid.ts'
import { generateMachineToken } from '~/utils/token.ts'
import { logger } from './logger.ts'

type ConnectProps = {
  studioUrl: string
  token: string
  storage: Storage<AgentSession>
  noCache?: boolean
}

/**
 * Connect the agent to Kubb Studio by obtaining a WebSocket session.
 * Attempts to reuse a cached session before making a network request.
 *
 */
export async function createAgentSession({ token, studioUrl, noCache, storage }: ConnectProps): Promise<AgentConnectResponse> {
  const machineToken = generateMachineToken()
  const sessionKey = getSessionKey(token)
  const connectUrl = `${studioUrl}/api/agent/session/create`
  const canCache = !noCache

  if (canCache) {
    const stored = await storage.getItem(sessionKey)

    if (stored && isSessionValid(stored)) {
      logger.success('Using cached agent session')

      return stored
    }

    if (stored) {
      await storage.removeItem(sessionKey)
    }
  }

  try {
    const data = await $fetch<AgentConnectResponse>(connectUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { machineToken },
    })

    if (!data) {
      throw new Error('No data available for agent session')
    }

    if (canCache) {
      await storage.setItem(sessionKey, { ...data, storedAt: new Date().toISOString() })
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
  const machineToken = generateMachineToken()
  const registerUrl = `${studioUrl}/api/agent/register`

  try {
    await $fetch(registerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { machineToken },
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
  const disconnectUrl = `${studioUrl}/api/agent/session/${sessionToken}/disconnect`

  try {
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
