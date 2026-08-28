import { ofetch as $fetch } from 'ofetch'
import type { AgentConnectResponse } from './protocol/index.ts'
import { getMachineToken } from './machine.ts'
import { logger, maskString, sleep } from './logger.ts'

/**
 * Delay before each registration attempt; the first attempt runs immediately.
 */
const REGISTER_RETRY_DELAYS_MS = [0, 2_000, 4_000, 8_000]

/**
 * Shared in-flight registration so concurrent pool sessions trigger one purge, not N.
 */
let registrationInFlight: Promise<boolean> | null = null

type ConnectProps = {
  studioUrl: string
  token: string
}

/**
 * Detects a 403 response from the session create endpoint, which means the machine
 * token stored in Studio no longer matches this agent (missing or mismatched).
 */
function isMachineTokenRejection(error: unknown): boolean {
  return (error as { statusCode?: number })?.statusCode === 403
}

function sessionError(cause: unknown): Error {
  return new Error('Failed to get agent session from Kubb Studio', { cause })
}

/**
 * Performs the raw session create request against Studio.
 */
async function requestAgentSession({ token, studioUrl }: ConnectProps): Promise<AgentConnectResponse> {
  const url = `${studioUrl}/api/agent/sessions`

  const data = await $fetch<AgentConnectResponse>(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { machineToken: await getMachineToken() },
  })

  if (!data) {
    throw new Error('No data available for agent session')
  }

  return data
}

/**
 * Obtain an agent session token from Kubb Studio via HTTP.
 *
 * When Studio rejects the machine token (403) — for example after the agent restarted
 * with a new identity while the startup registration call failed — the agent re-registers
 * and retries once, so a single failed registration can't permanently block session creation.
 */
export async function createAgentSession({ token, studioUrl }: ConnectProps): Promise<AgentConnectResponse> {
  logger.debug('Creating agent session with Studio...')

  try {
    const data = await requestAgentSession({ token, studioUrl })

    logger.debug('Created agent session with Studio')

    return data
  } catch (error: unknown) {
    if (!isMachineTokenRejection(error) || !(await registerAgent({ token, studioUrl }))) {
      throw sessionError(error)
    }

    const data = await requestAgentSession({ token, studioUrl }).catch((retryError: unknown) => {
      throw sessionError(retryError)
    })

    logger.info('Created agent session with Studio after re-registering')

    return data
  }
}

type RegisterProps = {
  studioUrl: string
  token: string
  poolSize?: number
}

/**
 * Register this agent with Kubb Studio by sending the machine ID.
 * Called on agent startup before creating a WebSocket session, and again when
 * Studio rejects the machine token during session creation.
 *
 * Retries with backoff because a failed registration leaves Studio with a stale
 * machine token that blocks every subsequent session create call. Registration
 * purges all of the agent's sessions on the Studio side, so concurrent callers
 * (multiple pool sessions hitting a 403 at once) share one in-flight run instead
 * of purging each other's fresh sessions.
 */
export function registerAgent(props: RegisterProps): Promise<boolean> {
  registrationInFlight ??= runRegistration(props).finally(() => {
    registrationInFlight = null
  })

  return registrationInFlight
}

async function runRegistration({ token, studioUrl, poolSize }: RegisterProps): Promise<boolean> {
  const url = `${studioUrl}/api/agent/connect`
  const machineToken = await getMachineToken()

  logger.debug('Registering agent with Studio...')

  for (const delayMs of REGISTER_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await sleep(delayMs)
    }

    try {
      await $fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { machineToken, poolSize },
      })
      logger.success(`Agent registered with Studio with token ${maskString(token)}`)

      return true
    } catch (error) {
      const { message, cause } = (error ?? {}) as { message?: string; cause?: { message?: string } }
      logger.warn('Failed to register agent with Studio, retrying...', cause?.message ?? message ?? String(error))
    }
  }

  logger.error(`Failed to register agent with Studio after ${REGISTER_RETRY_DELAYS_MS.length} attempts`)

  return false
}

type DisconnectProps = {
  studioUrl: string
  token: string
  sessionId: string
  slug?: string | null
}

/**
 * Notify Kubb Studio that this agent is disconnecting.
 * Called on process termination or server close.
 */
export async function disconnect({ sessionId, token, studioUrl, slug }: DisconnectProps): Promise<void> {
  const url = `${studioUrl}/api/agent/sessions/${sessionId}/disconnect`
  const tag = slug ?? 'agent'

  try {
    logger.debug(tag, 'Disconnecting from Studio...', { slug })

    await $fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    logger.success(tag, 'Disconnected from Studio', { slug })
  } catch (error) {
    throw new Error('Failed to notify Studio of disconnection on exit', {
      cause: error,
    })
  }
}
