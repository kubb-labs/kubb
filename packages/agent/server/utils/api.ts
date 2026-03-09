import type { AgentConnectResponse } from '~/types/agent.ts'
import { getMachineToken } from '~/utils/token.ts'
import { logger } from './logger.ts'
import { maskedString } from '@internals/utils'

type ConnectProps = {
  studioUrl: string
  token: string
}

/**
 * Obtain an agent session token from Kubb Studio via HTTP.
 */
export async function createAgentSession({ token, studioUrl }: ConnectProps): Promise<AgentConnectResponse> {
  const url = `${studioUrl}/api/agent/session/create`

  try {
    logger.info('Creating agent session with Studio...')

    const data = await $fetch<AgentConnectResponse>(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { machineToken: getMachineToken() },
    })

    if (!data) {
      throw new Error('No data available for agent session')
    }

    logger.info('Created agent session with Studio')

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
  const url = `${studioUrl}/api/agent/connect`

  try {
    logger.info('Registering agent with Studio...')

    await $fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { machineToken: getMachineToken(), poolSize },
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
  const url = `${studioUrl}/api/agent/session/${sessionId}/disconnect`
  const maskedSessionKey = maskedString(sessionId)

  try {
    logger.info(`[${maskedSessionKey}] Disconnecting from Studio...`)

    await $fetch(url, {
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
