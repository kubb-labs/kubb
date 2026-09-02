import { setTimeout as delay } from 'node:timers/promises'
import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import type { AgentConnectResponse } from './protocol/index.ts'
import { getMachineToken } from './machine.ts'

type PostJsonOptions = {
  headers?: Record<string, string>
  body?: unknown
  /**
   * Studio's device-token polling endpoint returns a body worth reading on 4xx too
   * (`authorization_pending`, `slow_down`, `access_denied`, ...), so set `allowErrorResponse` to
   * read the response instead of throwing.
   */
  allowErrorResponse?: boolean
}

/**
 * An HTTP failure from Studio. Carries `statusCode` so callers can branch on 401 vs 403 without
 * duck-typing a plain `Error`.
 */
export class HttpError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}

/**
 * Reads a human-readable message from a Studio JSON error body, when it has one.
 */
function responseMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') {
    return undefined
  }

  const body = data as { error_description?: unknown; message?: unknown; error?: unknown }
  for (const value of [body.error_description, body.message, body.error]) {
    if (typeof value === 'string' && value) {
      return value
    }
  }

  return undefined
}

/**
 * Posts JSON to Studio and parses the JSON response. Throws {@link HttpError} on a non-2xx status,
 * unless `allowErrorResponse` is set.
 */
export async function postJson<T>(url: string, { headers, body, allowErrorResponse }: PostJsonOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = (await response.json().catch(() => undefined)) as T

  if (!response.ok && !allowErrorResponse) {
    const detail = responseMessage(data)
    throw new HttpError(detail ?? `Request to ${url} failed with status ${response.status}`, response.status)
  }

  return data
}

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
 * Thrown when Studio rejects the agent token itself (401). Retrying cannot help: the token was
 * revoked, or the agent it belonged to was deleted in the Studio UI. Hosts catch this to forget
 * the stored credential and pair again.
 */
export class InvalidAgentTokenError extends Error {
  constructor(studioUrl: string, options?: ErrorOptions) {
    super(`Kubb Studio rejected this agent's token. It was revoked or the agent was deleted in ${studioUrl}.`, options)
    this.name = 'InvalidAgentTokenError'
  }
}

/**
 * Whether a thrown value carries `statusCode`. Not narrowed to {@link HttpError}: a `fetch` layer
 * or a host wrapper can throw its own error shape with the same field.
 *
 * A 401 means the agent token itself was rejected. A 403 from the session create endpoint means
 * the machine token stored in Studio no longer matches this agent (missing or mismatched).
 */
function rejectedWith(error: unknown, statusCode: number): boolean {
  return (error as { statusCode?: number } | undefined)?.statusCode === statusCode
}

function sessionError(cause: unknown): Error {
  const detail = getErrorMessage(cause)
  return new Error(detail ? `Failed to get agent session from Kubb Studio: ${detail}` : 'Failed to get agent session from Kubb Studio', { cause })
}

/**
 * Performs the raw session create request against Studio.
 */
async function requestAgentSession({ token, studioUrl }: ConnectProps): Promise<AgentConnectResponse> {
  const url = `${studioUrl}/api/agent/sessions`

  const data = await postJson<AgentConnectResponse>(url, {
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
 * When Studio rejects the machine token (403), for example after the agent restarted
 * with a new identity while the startup registration call failed, the agent re-registers
 * and retries once, so a single failed registration can't permanently block session creation.
 */
export async function createAgentSession({ token, studioUrl }: ConnectProps): Promise<AgentConnectResponse> {
  try {
    return await requestAgentSession({ token, studioUrl })
  } catch (error: unknown) {
    if (rejectedWith(error, 401)) {
      throw new InvalidAgentTokenError(studioUrl, { cause: error })
    }

    if (!rejectedWith(error, 403) || !(await registerAgent({ token, studioUrl }))) {
      throw sessionError(error)
    }

    try {
      return await requestAgentSession({ token, studioUrl })
    } catch (retryError: unknown) {
      if (rejectedWith(retryError, 401)) {
        throw new InvalidAgentTokenError(studioUrl, { cause: retryError })
      }

      throw sessionError(retryError)
    }
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

  for (const delayMs of REGISTER_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await delay(delayMs)
    }

    try {
      await postJson(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { machineToken, poolSize },
      })
      return true
    } catch (error) {
      if (rejectedWith(error, 401)) {
        throw new InvalidAgentTokenError(studioUrl, { cause: error })
      }

      console.warn(styleText('yellow', `Failed to register agent with Studio, retrying: ${getErrorMessage(error)}`))
    }
  }

  console.error(styleText('red', `Failed to register agent with Studio after ${REGISTER_RETRY_DELAYS_MS.length} attempts`))

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
 * Called on process termination or server close. A failed notify is logged and swallowed: the
 * local socket is already gone, and failing teardown must not block shutdown or reconnect.
 */
export async function disconnect({ sessionId, token, studioUrl, slug }: DisconnectProps): Promise<void> {
  const url = `${studioUrl}/api/agent/sessions/${sessionId}/disconnect`
  const tag = slug ?? 'agent'

  try {
    await postJson(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log(styleText('green', `[${tag}] Disconnected from Studio`))
  } catch (error) {
    console.warn(styleText('yellow', `[${tag}] Failed to notify Studio of disconnection: ${getErrorMessage(error)}`))
  }
}
