import type { Storage } from 'unstorage'
import type { AgentConnectResponse } from '~/types/agent.ts'
import { getSessionKey } from '~/utils/getSessionKey.ts'
import { type AgentSession, isSessionValid } from '~/utils/isSessionValid.ts'
import { maskedString } from '~/utils/maskedString.ts'
import { generateMachineToken } from '~/utils/token.ts'
import { logger } from './logger.ts'

type ConnectProps = {
  studioUrl: string
  token: string
  storage: Storage<AgentSession>
  noCache?: boolean
  /** Optional override for the storage cache key. When provided, replaces the default key derived from the token. */
  cacheKey?: string
}

/**
 * Obtain an agent session token from Kubb Studio via HTTP.
 * Attempts to reuse a valid cached session before making a network request.
 */
export async function createAgentSession({ token, studioUrl, noCache, storage, cacheKey }: ConnectProps): Promise<AgentConnectResponse> {
  const machineToken = generateMachineToken()
  const sessionKey = cacheKey ?? getSessionKey(token)
  const maskedSessionKey = maskedString(sessionKey)
  const connectUrl = `${studioUrl}/api/agent/session/create`
  const canCache = !noCache

  if (canCache) {
    const agentSession = await storage.getItem(sessionKey)

    if (agentSession && isSessionValid(agentSession)) {
      logger.success(`[${maskedSessionKey}] Using cached agent session`)

      return agentSession
    }

    if (agentSession) {
      logger.info(`[${maskedSessionKey}] Removing expired agent session from cache...`)

      await storage.removeItem(sessionKey)

      logger.success(`[${maskedSessionKey}] Removed expired agent session from cache`)
    }
  }

  try {
    logger.info(`[${maskedSessionKey}] Creating agent session with Studio...`)

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

      logger.success(`[${maskedSessionKey}] Saved agent session to cache`)
    }

    logger.info(`[${maskedSessionKey}] Created agent session with Studio`)

    return data
  } catch (error: any) {
    throw new Error('Failed to get agent session from Kubb Studio', { cause: error })
  }
}

type RegisterProps = {
  studioUrl: string
  token: string
  poolSize?: number
}

/**
 * Register this agent with Kubb Studio by sending the machine ID.
 * Called once on agent startup before creating a WebSocket session.
 */
export async function registerAgent({ token, studioUrl, poolSize }: RegisterProps): Promise<void> {
  const machineToken = generateMachineToken()
  const registerUrl = `${studioUrl}/api/agent/register`

  try {
    logger.info('Registering agent with Studio...')

    await $fetch(registerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { machineToken, poolSize },
    })
    logger.success(`Agent registered with Studio with token ${maskedString(token)}`)
  } catch (error: any) {
    logger.error('Failed to register agent with Studio', error?.cause?.message ?? error?.message)
  }
}

type DisconnectProps = {
  studioUrl: string
  token: string
  sessionId: string
}

/**
 * Notify Kubb Studio that this agent is disconnecting.
 * Called on process termination or server close.
 */
export async function disconnect({ sessionId, token, studioUrl }: DisconnectProps): Promise<void> {
  const disconnectUrl = `${studioUrl}/api/agent/session/${sessionId}/disconnect`
  const maskedSessionKey = maskedString(sessionId)

  try {
    logger.info(`[${maskedSessionKey}] Disconnecting from Studio...`)

    await $fetch(disconnectUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    logger.success(`[${maskedSessionKey}] Disconnected from Studio`)
  } catch (error: any) {
    throw new Error('Failed to notify Studio of disconnection on exit', { cause: error })
  }
}
