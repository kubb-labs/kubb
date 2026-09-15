import { styleText } from 'node:util'
import { getErrorMessage } from '@internals/utils'
import { FetchError, ofetch } from 'ofetch'
import type { AgentConnectResponse } from './protocol/index.ts'
import type { CIContext } from './ci.ts'

/**
 * Reads a human-readable message from a Studio JSON error body, when it has one. `FetchError`'s own
 * message stops at the status line, so the detail Studio sends with a failure (an agent limit, a
 * revoked token) would otherwise never reach the user.
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
 * Retries after the first registration attempt, each backing off twice as far as the last.
 */
const REGISTER_RETRIES = 3

/**
 * Shared in-flight registration so concurrent pool sessions trigger one purge, not N.
 */
let registrationInFlight: Promise<boolean> | null = null

type ConnectProps = {
  studioUrl: string
  token: string
  machineToken: string
}

export type StudioAgentJobStatus = 'queued' | 'running' | 'success' | 'failed'

export type StudioSnapshot = {
  id: string
  name: string | null
  version: string | null
  integrity: string | null
  url: string
  snapshotIdUrl: string
  expiresAt: string
}

export type StudioAgentCredentials = {
  id: string
  slug: string
  token: string
}

export type StudioAgentJob = {
  id: string
  status: StudioAgentJobStatus
  error?: string
  snapshot?: StudioSnapshot
}

type StudioRequestOptions = {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
}

async function studioRequest<T>({
  studioUrl,
  token,
  path,
  options = {},
}: {
  studioUrl: string
  token: string
  path: string
  options?: StudioRequestOptions
}): Promise<T> {
  try {
    return await ofetch<T>(`${studioUrl}${path}`, {
      method: options.method,
      headers: { authorization: `Bearer ${token}`, 'x-api-key': token },
      body: options.body,
    })
  } catch (error) {
    const detail = error instanceof FetchError ? responseMessage(error.data) : undefined
    throw new Error(detail ?? getErrorMessage(error), { cause: error })
  }
}

export async function createAgent({
  studioUrl,
  token,
  name,
  machineToken,
}: {
  studioUrl: string
  token: string
  name: string
  machineToken: string
}): Promise<StudioAgentCredentials> {
  return studioRequest<StudioAgentCredentials>({
    studioUrl,
    token,
    path: '/api/agents',
    options: {
      method: 'POST',
      body: { name, machineToken },
    },
  })
}

export async function createJob({
  studioUrl,
  token,
  type,
  agentId,
  context,
  name,
  version,
}: {
  studioUrl: string
  token: string
  type: 'generation' | 'snapshot'
  agentId: string
  context: CIContext
  name?: string
  version?: string
}): Promise<StudioAgentJob> {
  const { job } = await studioRequest<{ job: StudioAgentJob }>({
    studioUrl,
    token,
    path: '/api/jobs',
    options: {
      method: 'POST',
      body: { type, agentId, context, name, version },
    },
  })

  return job
}

export async function waitForJob({ studioUrl, token, id }: { studioUrl: string; token: string; id: string }): Promise<StudioAgentJob> {
  for (;;) {
    const { job } = await studioRequest<{ job: StudioAgentJob }>({ studioUrl, token, path: `/api/jobs/${id}` })

    if (job.status === 'success' || job.status === 'failed') return job

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
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
 * Whether a thrown value carries `statusCode`. Not narrowed to `FetchError`: a host wrapper can
 * throw its own error shape with the same field.
 *
 * A 401 means the agent token itself was rejected. A 403 from the session create endpoint means
 * the machine token stored in Studio no longer matches this agent (missing or mismatched).
 */
function rejectedWith(error: unknown, statusCode: number): boolean {
  return (error as { statusCode?: number } | undefined)?.statusCode === statusCode
}

function sessionError(cause: unknown): Error {
  const detail = (cause instanceof FetchError ? responseMessage(cause.data) : undefined) ?? getErrorMessage(cause)
  return new Error(detail ? `Failed to get agent session from Kubb Studio: ${detail}` : 'Failed to get agent session from Kubb Studio', { cause })
}

/**
 * Performs the raw session create request against Studio.
 */
async function requestAgentSession({ token, studioUrl, machineToken }: ConnectProps): Promise<AgentConnectResponse> {
  const url = `${studioUrl}/api/agent/sessions`

  const data = await ofetch<AgentConnectResponse>(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { machineToken },
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
export async function createAgentSession({ token, studioUrl, machineToken }: ConnectProps): Promise<AgentConnectResponse> {
  try {
    return await requestAgentSession({ token, studioUrl, machineToken })
  } catch (error: unknown) {
    if (rejectedWith(error, 401)) {
      throw new InvalidAgentTokenError(studioUrl, { cause: error })
    }

    if (!rejectedWith(error, 403) || !(await registerAgent({ token, studioUrl, machineToken }))) {
      throw sessionError(error)
    }

    try {
      return await requestAgentSession({ token, studioUrl, machineToken })
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
  machineToken: string
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

async function runRegistration({ token, studioUrl, poolSize, machineToken }: RegisterProps): Promise<boolean> {
  try {
    await ofetch(`${studioUrl}/api/agent/connect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: { machineToken, poolSize },
      retry: REGISTER_RETRIES,
      // 2s, 4s, then 8s. `retry` counts down, so the first retry is the one with the most left.
      retryDelay: ({ options }) => 2_000 * 2 ** (REGISTER_RETRIES - Number(options.retry)),
    })

    return true
  } catch (error) {
    if (rejectedWith(error, 401)) {
      throw new InvalidAgentTokenError(studioUrl, { cause: error })
    }

    console.error(styleText('red', `Failed to register agent with Studio after ${REGISTER_RETRIES + 1} attempts`))

    return false
  }
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
    await ofetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    console.log(styleText('green', `[${tag}] Disconnected from Studio`))
  } catch (error) {
    const statusCode = (error as { statusCode?: number } | undefined)?.statusCode
    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) return

    console.warn(styleText('yellow', `[${tag}] Failed to notify Studio of disconnection: ${getErrorMessage(error)}`))
  }
}
