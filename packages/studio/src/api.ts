import { setTimeout as delay } from 'node:timers/promises'
import { getErrorMessage } from '@internals/utils'
import { FetchError, ofetch } from 'ofetch'
import type { AgentCapacity, AgentRegisterInput, AgentRegisterResponse } from './protocol/index.ts'
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
 * Thrown when Studio refuses this agent's protocol version (426). Retrying cannot help until the
 * agent is upgraded, so hosts stop instead of reconnecting.
 */
export class IncompatibleAgentError extends Error {
  constructor(studioUrl: string, detail?: string, options?: ErrorOptions) {
    super(`Kubb Studio at ${studioUrl} requires a newer agent${detail ? `: ${detail}` : ''}. Upgrade @kubb/studio or the Kubb agent image.`, options)
    this.name = 'IncompatibleAgentError'
  }
}

/**
 * Whether a thrown value carries `statusCode`. Not narrowed to `FetchError`: a host wrapper can
 * throw its own error shape with the same field.
 */
function rejectedWith(error: unknown, statusCode: number): boolean {
  return (error as { statusCode?: number } | undefined)?.statusCode === statusCode
}

function registrationError(cause: unknown): Error {
  const detail = (cause instanceof FetchError ? responseMessage(cause.data) : undefined) ?? getErrorMessage(cause)
  return new Error(detail ? `Failed to register with Kubb Studio: ${detail}` : 'Failed to register with Kubb Studio', { cause })
}

type RegisterProps = {
  studioUrl: string
  token: string
  /** Names this agent process, so Studio tells two processes sharing one token apart. */
  instanceId: string
  capacity: AgentCapacity
}

/**
 * Registers this agent process with Kubb Studio (`POST /api/agent/connect`): binds the machine
 * identity to the token, reports what the process can take on, and gets back the URL of the one
 * socket it keeps open.
 *
 * Retries a transient failure with backoff. A rejected token (401) throws
 * {@link InvalidAgentTokenError} and an unsupported agent version (426) throws
 * {@link IncompatibleAgentError}, since retrying either cannot help.
 */
export async function registerAgent({ token, studioUrl, instanceId, capacity }: RegisterProps): Promise<AgentRegisterResponse> {
  const body: AgentRegisterInput = { machineToken: await getMachineToken(), instanceId, capacity }

  try {
    return await ofetch<AgentRegisterResponse>(`${studioUrl}/api/agent/connect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
      retry: REGISTER_RETRIES,
      // 2s, 4s, then 8s. `retry` counts down, so the first retry is the one with the most left.
      retryDelay: ({ options }) => 2_000 * 2 ** (REGISTER_RETRIES - Number(options.retry)),
    })
  } catch (error) {
    if (rejectedWith(error, 401)) throw new InvalidAgentTokenError(studioUrl, { cause: error })
    if (rejectedWith(error, 426))
      throw new IncompatibleAgentError(studioUrl, error instanceof FetchError ? responseMessage(error.data) : undefined, { cause: error })
    throw registrationError(error)
  }
}

/**
 * Status values returned by Studio's jobs API.
 */
export type StudioJobStatus = 'queued' | 'running' | 'success' | 'failed' | 'canceled'

/** How a snapshot's files differ from an earlier snapshot of the same package, relative to `output.path`. */
export type StudioSnapshotChanges = {
  /** The snapshot these changes are measured against, `null` when there is none to compare with. */
  base: {
    id: string
    version: string | null
    /** The commit the base snapshot was built from, when reported. */
    commit?: string
    createdAt: string
  } | null
  added: Array<string>
  changed: Array<string>
  removed: Array<string>
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
  /** What differs from the latest snapshot of the CI agent `baseId` names. Absent without a base. */
  branchChanges?: StudioSnapshotChanges
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
 * First wait before `createJob` retries a busy or queue-full response, absent a `Retry-After` hint.
 */
const CREATE_JOB_INITIAL_DELAY_MS = 1_000

/**
 * Slowest `createJob` backs off to between retries.
 */
const CREATE_JOB_MAX_INTERVAL_MS = 10_000

/**
 * Statuses worth retrying: the agent has no free connection yet (409, a stale conflict a moment
 * later resolves), its queue is momentarily full (429), or it has no live connection at all yet
 * (503, an agent process that is mid-reconnect). Anything else (404 agent not found, 401/403 auth)
 * is thrown straight away, since retrying cannot change the outcome.
 */
const CREATE_JOB_RETRYABLE_STATUSES = new Set([409, 429, 503])

/**
 * Reads Studio's `Retry-After` header (seconds) off a thrown `ofetch` error, when present.
 */
function retryAfterMs(error: unknown): number | undefined {
  const seconds = Number((error as { response?: Response }).response?.headers.get('retry-after'))
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : undefined
}

/**
 * Adds up to 30% jitter, so every CI run queued behind the same busy agent does not retry in
 * lockstep.
 */
function withJitter(ms: number): number {
  return ms + Math.random() * ms * 0.3
}

/**
 * Queues a generation or snapshot job on Studio (`POST /api/jobs`).
 *
 * Returns as soon as Studio accepts the job (`202`). Poll with {@link waitForJob} until it finishes.
 * Authenticates with the organization CI API key via `x-api-key`.
 *
 * A busy agent, a full queue, or a momentary lack of a live connection (409, 429, 503) retries with
 * exponential backoff and jitter, honoring Studio's `Retry-After` header when it sends one, up to
 * `timeoutMs`. Every other failure, including a missing agent (404), throws immediately.
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
  baseId,
  config,
  instanceId,
  timeoutMs = 60_000,
  signal,
}: {
  studioUrl: string
  token: string
  type: 'generation' | 'snapshot'
  agentId: string
  name?: string
  version?: string
  /** The commit this snapshot is built from, so the next one can diff against it. */
  commit?: string
  /** The `id` another CI agent's runs register under, such as the base branch's; this snapshot is also compared with its latest one. */
  baseId?: string
  config?: Record<string, unknown>
  /**
   * The agent process to run the job on, the `instanceId` its client connected with. A CI run passes
   * its own, so an overlapping pipeline under the same CI agent never builds its checkout.
   */
  instanceId?: string
  /**
   * How long to keep retrying a busy or queue-full response before giving up, in milliseconds.
   *
   * @default 60000
   */
  timeoutMs?: number
  signal?: AbortSignal
}): Promise<StudioJob> {
  const deadline = Date.now() + timeoutMs
  let interval = CREATE_JOB_INITIAL_DELAY_MS

  for (;;) {
    signal?.throwIfAborted()

    try {
      const { job } = await ofetch<{ job: StudioJob }>(`${studioUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'x-api-key': token },
        body: { type, agentId, name, version, commit, baseId, config, instanceId },
        retry: false,
        timeout: Math.max(deadline - Date.now(), 1),
        signal,
      })

      return job
    } catch (error) {
      signal?.throwIfAborted()

      const status = (error as { response?: { status?: number } }).response?.status
      if (!status || !CREATE_JOB_RETRYABLE_STATUSES.has(status) || Date.now() >= deadline) throw error

      const wait = Math.min(retryAfterMs(error) ?? withJitter(interval), Math.max(deadline - Date.now(), 0))
      if (signal) {
        await delay(wait, undefined, { signal })
      } else {
        await new Promise((resolve) => setTimeout(resolve, wait))
      }
      if (Date.now() >= deadline) throw error
      interval = Math.min(interval * 2, CREATE_JOB_MAX_INTERVAL_MS)
    }
  }
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
  signal,
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
  signal?: AbortSignal
}): Promise<StudioJob> {
  const deadline = Date.now() + timeoutMs
  let interval = INITIAL_POLL_DELAY_MS

  for (;;) {
    signal?.throwIfAborted()

    const wait = Math.max(Math.min(interval, deadline - Date.now()), 0)
    if (signal) {
      await delay(wait, undefined, { signal })
    } else {
      await new Promise((resolve) => setTimeout(resolve, wait))
    }

    if (Date.now() >= deadline) throw new Error('Timed out waiting for the Studio job')

    interval = Math.min(interval * 2, MAX_POLL_INTERVAL_MS)

    try {
      // ofetch retries a 429 immediately, which spends the rate limit faster than not retrying.
      const { job } = await ofetch<{ job: StudioJob }>(`${studioUrl}/api/jobs/${id}`, {
        headers: { 'x-api-key': token },
        retry: false,
        timeout: Math.max(deadline - Date.now(), 1),
        signal,
      })

      if (job.status === 'success' || job.status === 'failed' || job.status === 'canceled') return job
    } catch (error) {
      signal?.throwIfAborted()

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
