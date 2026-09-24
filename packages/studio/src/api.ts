import { getErrorMessage } from '@internals/utils'
import { FetchError, ofetch } from 'ofetch'
import type { AgentConnectResponse } from './protocol/index.ts'
import { getMachineToken } from './machine.ts'

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
async function requestAgentSession({ token, studioUrl }: ConnectProps): Promise<AgentConnectResponse> {
  const url = `${studioUrl}/api/agent/sessions`

  const data = await ofetch<AgentConnectResponse>(url, {
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
  const machineToken = await getMachineToken()

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

    return false
  }
}

type DisconnectProps = {
  studioUrl: string
  token: string
  sessionId: string
}

/**
 * Notify Kubb Studio that this agent is disconnecting.
 * Called on process termination or server close. Never throws: the local socket is already gone,
 * and failing teardown must not block shutdown or reconnect.
 *
 * @returns `false` when Studio could not be reached or rate limited the call. Any other 4xx
 * counts as notified, since it means Studio already dropped the session.
 */
export async function disconnect({ sessionId, token, studioUrl }: DisconnectProps): Promise<boolean> {
  try {
    await ofetch(`${studioUrl}/api/agent/sessions/${sessionId}/disconnect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return true
  } catch (error) {
    const statusCode = (error as { statusCode?: number } | undefined)?.statusCode

    return statusCode !== undefined && statusCode !== 429 && statusCode >= 400 && statusCode < 500
  }
}

/**
 * Status values returned by Studio's jobs API.
 */
export type StudioJobStatus = 'queued' | 'running' | 'success' | 'failed' | 'canceled'

/** Generated files that differ between two sets, by path relative to the config's `root`. */
export type StudioFileChanges = {
  added: Array<string>
  changed: Array<string>
  removed: Array<string>
}

/** How a snapshot's files differ from an earlier snapshot of the same package. */
export type StudioSnapshotChanges = StudioFileChanges & {
  /** The snapshot these changes are measured against, `null` when there is none to compare with. */
  base: {
    id: string
    version: string | null
    /** The commit the base snapshot was built from, when reported. */
    commit?: string
    createdAt: string
  } | null
}

/**
 * Package view returned on a successful snapshot job from Studio.
 */
export type StudioSnapshot = {
  /**
   * Immutable snapshot id.
   */
  id: string
  /**
   * npm package name, or `null` when Studio stored none.
   */
  name: string | null
  /**
   * npm package version, or `null` when Studio stored none.
   */
  version: string | null
  /**
   * Subresource integrity hash for the tarball, or `null` when unavailable.
   */
  integrity: string | null
  /**
   * Preferable download path, often the readable `/packages/{agentSlug}/{name}.tgz` form.
   */
  url: string
  /**
   * Stable download path keyed by snapshot id.
   */
  snapshotIdUrl: string
  /**
   * ISO timestamp after which Studio may delete the tarball.
   */
  expiresAt: string
  /** What changed since the previous snapshot on the same agent. Absent when Studio or the agent predates it. */
  changes?: StudioSnapshotChanges
  /**
   * What differs from the latest snapshot on the agent `baseMachineToken` names, such as the branch a
   * pull request merges into. `base` is `null` when that agent has no snapshot to compare with.
   * Absent when the job named no base, or Studio predates it.
   */
  branchChanges?: StudioSnapshotChanges
  /**
   * What differs from the output directory on disk before the run, such as committed generated code.
   * Only when the agent may read files and has a project on disk.
   */
  diskChanges?: StudioFileChanges
}

/**
 * Job record from `POST /api/jobs` and `GET /api/jobs/{id}`.
 */
export type StudioJob = {
  /**
   * Job id returned by Studio when the job was queued.
   */
  id: string
  /**
   * Current status. Poll until `success`, `failed`, or `canceled`.
   */
  status: StudioJobStatus
  /**
   * Failure message when `status` is `failed`.
   */
  error?: string
  /**
   * Package view when a snapshot job finished successfully.
   */
  snapshot?: StudioSnapshot
}

/**
 * Queues a generation or snapshot job on Studio (`POST /api/jobs`).
 *
 * Returns as soon as Studio accepts the job (`202`). Poll with {@link waitForJob} until it finishes.
 * Authenticates with the organization CI API key via `x-api-key`.
 *
 * @example Snapshot job
 * ```ts
 * const job = await createJob({
 *   studioUrl: 'https://kubb.studio',
 *   token: process.env.KUBB_TOKEN!,
 *   type: 'snapshot',
 *   agentId: agent.id,
 *   name: '@kubb/demo',
 *   version: '1.0.0',
 * })
 * const finished = await waitForJob({ studioUrl, token, id: job.id })
 * ```
 */
export async function createJob({
  studioUrl,
  token,
  type,
  agentId,
  name,
  version,
  commit,
  baseMachineToken,
  config,
}: {
  studioUrl: string
  token: string
  type: 'generation' | 'snapshot'
  agentId: string
  name?: string
  version?: string
  /** The commit this snapshot is built from, so the next one can diff against it. */
  commit?: string
  /**
   * Machine token of the agent whose latest snapshot this one is also compared with, such as the
   * agent a CI run on the pull request's base branch registers under, derived with `machineTokenFrom`.
   */
  baseMachineToken?: string
  config?: Record<string, unknown>
}): Promise<StudioJob> {
  const { job } = await ofetch<{ job: StudioJob }>(`${studioUrl}/api/jobs`, {
    method: 'POST',
    headers: { 'x-api-key': token },
    body: { type, agentId, name, version, commit, baseMachineToken, config },
  })

  return job
}

/**
 * A job runs a generation and packs a tarball, so it is never done the instant it is queued.
 */
const INITIAL_POLL_DELAY_MS = 2_000

/**
 * Slowest the poll backs off to. Requests per run are roughly `timeoutMs` divided by this, and
 * every concurrent run on the same organization key draws on one budget.
 */
const MAX_POLL_INTERVAL_MS = 30_000

/**
 * Polls `GET /api/jobs/{id}` until the job reaches a terminal status, waiting
 * {@link INITIAL_POLL_DELAY_MS} first and doubling up to {@link MAX_POLL_INTERVAL_MS} so a long
 * job stays inside the API key's rate limit.
 *
 * A `failed` job resolves normally. Check `job.status` and `job.error`. Throws only when the
 * deadline passes before Studio finishes.
 */
export async function waitForJob({
  studioUrl,
  token,
  id,
  timeoutMs = 60_000,
}: {
  studioUrl: string
  token: string
  id: string
  /**
   * How long to keep polling before throwing, in milliseconds.
   *
   * @default 60000
   */
  timeoutMs?: number
}): Promise<StudioJob> {
  const deadline = Date.now() + timeoutMs
  let interval = INITIAL_POLL_DELAY_MS

  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, Math.max(Math.min(interval, deadline - Date.now()), 0)))

    if (Date.now() >= deadline) throw new Error('Timed out waiting for the Studio job')

    interval = Math.min(interval * 2, MAX_POLL_INTERVAL_MS)

    try {
      // ofetch retries a 429 immediately, which spends the rate limit faster than not retrying.
      const { job } = await ofetch<{ job: StudioJob }>(`${studioUrl}/api/jobs/${id}`, {
        headers: { 'x-api-key': token },
        retry: false,
      })

      if (job.status === 'success' || job.status === 'failed' || job.status === 'canceled') return job
    } catch (error) {
      const response = (error as { response?: { status?: number; _data?: { data?: { tryAgainIn?: unknown } } } }).response

      if (response?.status !== 429) throw error

      const retryAfter = response._data?.data?.tryAgainIn
      const usable = typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0

      // Studio's wait may exceed the ceiling, and a refusal must never shorten the next poll.
      interval = Math.max(interval, usable ? retryAfter : MAX_POLL_INTERVAL_MS)
    }
  }
}

/**
 * CI agent returned by {@link createAgent}. The token is issued only once, at creation or reuse.
 */
export type StudioAgent = {
  /**
   * Agent id, passed to {@link createJob} as `agentId`.
   */
  id: string
  /**
   * Human-readable slug, used to build the readable snapshot URL and the agent's Studio page.
   */
  slug: string
  /**
   * Agent display name.
   */
  name: string
  /**
   * Bearer token for the WebSocket agent session. Mask it before logging.
   */
  token: string
}

/**
 * Creates or reuses a CI agent (`POST /api/agents`), keyed by `(organization, machineToken)`.
 * Authenticates via `x-api-key`. Reusing the same `machineToken` reuses the same agent instead of
 * consuming a new one from the organization's agent limit.
 */
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
}): Promise<StudioAgent> {
  try {
    return await ofetch<StudioAgent>(`${studioUrl}/api/agents`, {
      method: 'POST',
      headers: { 'x-api-key': token },
      body: { name, machineToken },
    })
  } catch (error: unknown) {
    if (error instanceof FetchError) {
      const upgradeUrl = (error.data as { data?: { upgradeUrl?: string } } | undefined)?.data?.upgradeUrl
      const detail = responseMessage(error.data) ?? getErrorMessage(error)
      const hint = upgradeUrl ? ` Agent limit reached; upgrade at ${upgradeUrl}.` : ''
      throw new Error(`Failed to create a Kubb Studio agent: ${detail}${hint}`, { cause: error })
    }

    throw error
  }
}
