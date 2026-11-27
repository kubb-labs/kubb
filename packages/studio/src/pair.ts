import { hash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { toError } from '@internals/utils'
import { Diagnostics } from '@kubb/core'
import { ofetch } from 'ofetch'
import { getAgentPublicKey, getTokenRefreshPayload, signAgentPayload } from './agentKey.ts'
import { InvalidAgentTokenError } from './connect.ts'
import { AgentSignatureContext, type TokenRefreshProof } from './protocol.ts'
import { defaultStudioUrl, secureUrl } from './url.ts'

/**
 * RFC 8628 device-authorization response from Studio's `/api/auth/device/code` endpoint.
 * Field names match the RFC; the CLI polls with `device_code` and shows `user_code` to the user.
 */
export type PairingSession = {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete: string
  expires_in: number
  interval: number
}

export type PairingResult = {
  /**
   * Bearer token for this machine. Write credentials with mode 0600 and never log the value.
   */
  token: string
  agent: {
    /**
     * Stable agent id in Studio.
     */
    id: string
    /**
     * Short slug used in logs and the UI (for example `brave-otter`).
     */
    slug: string
    /**
     * Display name chosen at pairing time.
     */
    name: string
    /**
     * This agent's organization slug, absent for a sandbox or global agent, which has none.
     */
    organizationSlug?: string
  }
}

/**
 * What this machine registers as. Any member may approve `cli` (`kubb studio`); only an admin may
 * approve `user` and `sandbox` (the Docker image). A `ci` agent never pairs.
 */
export type PairingAgentType = 'cli' | 'user' | 'sandbox'

/** Labels, not secrets: a person approving the code in the browser is what authorizes a pairing. */
const CLIENT_IDS = { cli: 'kubb-cli', agent: 'kubb-agent' } as const

/**
 * Thrown when a caller aborts `startPairing` or `pollForPairingToken` through their `signal`, such
 * as a `kubb studio` shutdown mid-pairing. Distinct from a denial or an expired code, so a host can
 * exit quietly instead of reporting a pairing failure.
 */
export class PairingCanceledError extends Error {
  constructor() {
    super('Pairing was canceled')
    this.name = 'PairingCanceledError'
  }
}

/** Thrown when the code expired unapproved. A fresh code can still succeed. */
export class PairingExpiredError extends Error {
  constructor(message = 'The pairing code expired, pair again') {
    super(message)
    this.name = 'PairingExpiredError'
  }
}

/** Thrown when the pairing was denied in the browser, including by the organization's agent limit. */
export class PairingDeniedError extends Error {
  constructor(message = 'Pairing was denied in the browser') {
    super(message)
    this.name = 'PairingDeniedError'
  }
}

export type StartPairingOptions = {
  studioUrl?: string
  type: PairingAgentType
  /**
   * Display name for the agent, usually the project or machine name.
   */
  name: string
  hostname: string
  /**
   * A stable secret the host keeps for this machine. Studio stores its hash against the agent, so
   * the same machine pairing again rotates one agent's token instead of creating a second agent.
   */
  machineId: string
  /**
   * The agent key from `generateAgentKey`. Only its public half is sent.
   */
  privateKey?: string
  /**
   * Aborting this cancels the request in flight and rejects with {@link PairingCanceledError}.
   */
  signal?: AbortSignal
}

/**
 * Asks Studio for a pairing code, sending the hashed machine id with it.
 */
export async function startPairing({
  studioUrl = defaultStudioUrl,
  type,
  name,
  hostname,
  machineId,
  privateKey,
  signal,
}: StartPairingOptions): Promise<PairingSession> {
  try {
    const pairing = await ofetch<PairingSession>(secureUrl({ studioUrl, path: '/api/auth/device/code' }).href, {
      method: 'POST',
      body: {
        client_id: type === 'cli' ? CLIENT_IDS.cli : CLIENT_IDS.agent,
        name,
        hostname,
        machine_token: hash('sha256', machineId),
        agent_kind: type === 'cli' ? undefined : type,
        public_key: privateKey ? getAgentPublicKey(privateKey) : undefined,
      },
      // A redirect would send this machine's pairing request, and later its tokens, to wherever it points.
      redirect: 'error',
      signal,
    })
    if (typeof pairing?.device_code !== 'string')
      throw new Diagnostics.Error({
        code: Diagnostics.code.unknown,
        severity: 'error',
        message: 'Kubb Studio returned no pairing code',
        help: 'Try again later. If it keeps failing, check the Kubb Studio status.',
      })

    return pairing
  } catch (error) {
    if (signal?.aborted) {
      throw new PairingCanceledError()
    }

    throw error
  }
}

export type PollForPairingTokenOptions = {
  studioUrl?: string
  session: PairingSession
  /**
   * Aborting this stops polling and rejects with {@link PairingCanceledError}, whether the abort
   * lands between polls or during the wait for the next one.
   */
  signal?: AbortSignal
  /** Called when a poll could not reach Studio. Polling carries on. */
  onRetry?: (error: Error) => void
}

type PollError = 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | 'invalid_grant'

type PollResponse =
  | PairingResult
  | {
      error: PollError | string
      /**
       * Why, when Studio has something more useful to say than the RFC code. An approval that hits
       * the organization's agent limit comes back as `access_denied` with the limit spelled out.
       */
      error_description?: string
    }

async function waitForNextPoll({ ms, signal }: { ms: number; signal?: AbortSignal }): Promise<void> {
  if (signal?.aborted) throw new PairingCanceledError()
  await delay(ms, undefined, { signal }).catch(() => {
    throw new PairingCanceledError()
  })
}

async function requestPairingToken({
  studioUrl,
  session,
  signal,
}: {
  studioUrl: string
  session: PairingSession
  signal?: AbortSignal
}): Promise<PollResponse> {
  // A denial, an expiry, and "not yet" all come back as 4xx with a body to switch on.
  const { status, _data } = await ofetch.raw<PollResponse>(secureUrl({ studioUrl, path: '/api/agent/token' }).href, {
    method: 'POST',
    body: { device_code: session.device_code },
    redirect: 'error',
    signal,
    ignoreResponseError: true,
  })
  if (status >= 500 || !_data || typeof _data !== 'object')
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequestFailed,
      severity: 'error',
      message: `Kubb Studio answered with status ${status}`,
      help: 'Try again later.',
    })
  return _data
}

// The wait before the next poll, or a throw when Studio's answer ends the pairing.
function nextPollInterval({ response, intervalMs }: { response: PollResponse; intervalMs: number }): number {
  if (!('error' in response) || typeof response.error !== 'string') {
    throw new Diagnostics.Error({
      code: Diagnostics.code.unknown,
      severity: 'error',
      message: 'Kubb Studio returned an empty pairing response, pair again',
    })
  }
  if (response.error === 'authorization_pending') return intervalMs
  if (response.error === 'slow_down') return intervalMs + 5_000
  if (response.error === 'access_denied') throw new PairingDeniedError(response.error_description)
  if (response.error === 'expired_token' || response.error === 'invalid_grant') throw new PairingExpiredError(response.error_description)

  throw new Diagnostics.Error({
    code: Diagnostics.code.unknown,
    severity: 'error',
    message: response.error_description ?? `Pairing failed (${response.error})`,
    help: 'Pair again with `kubb studio login`.',
  })
}

function isPairingResult(response: PollResponse): response is PairingResult {
  return 'token' in response && typeof response.token === 'string'
}

/**
 * Polls until the user approves or denies, honoring the server's `slow_down` back-off.
 *
 * Studio's own endpoint is used rather than the auth layer's `/device/token`, because an approved
 * Kubb pairing is worth an agent bearer token, not a user session.
 *
 * @throws {PairingExpiredError} when the code expires before anyone approves it.
 * @throws {PairingDeniedError} when the pairing is denied in the browser.
 * @throws {PairingCanceledError} when `signal` aborts.
 */
export async function pollForPairingToken({ studioUrl = defaultStudioUrl, session, signal, onRetry }: PollForPairingTokenOptions): Promise<PairingResult> {
  // Both fields cross the network, so neither is trusted as-is: a missing or zero `interval` would
  // spin the poll loop, and a missing or zero `expires_in` would expire the code before the first
  // poll. `> 0` is also false for `NaN` and for a missing field, so it doubles as the type guard.
  const deadline = Date.now() + (session.expires_in > 0 ? session.expires_in : 600) * 1000
  let intervalMs = (session.interval > 0 ? session.interval : 5) * 1000

  while (Date.now() < deadline) {
    await waitForNextPoll({ ms: intervalMs, signal })
    const response = await requestPairingToken({ studioUrl, session, signal }).catch((error: unknown) => {
      if (signal?.aborted) throw new PairingCanceledError()
      // Studio can be briefly unreachable (a deploy) while the code is still valid, so retry.
      onRetry?.(toError(error))
      return undefined
    })
    if (!response) continue
    if (isPairingResult(response)) return response
    intervalMs = nextPollInterval({ response, intervalMs })
  }

  throw new PairingExpiredError()
}

export type PairAgentOptions = StartPairingOptions & {
  /** Shows the code to whoever approves it. Called again for each fresh code. */
  onCode: (session: PairingSession, attempt: number) => void | Promise<void>
  /** Called when a poll could not reach Studio. Polling carries on. */
  onRetry?: (error: Error) => void
  /**
   * Codes to ask for in total when one expires unapproved. A denial or abort ends it at once.
   * @default 1
   */
  maxAttempts?: number
}

/**
 * Pairs this machine with Studio: asks for a code, hands it to the host to show, and waits for approval.
 */
export async function pairAgent({ onCode, onRetry, maxAttempts = 1, ...options }: PairAgentOptions): Promise<PairingResult> {
  for (let attempt = 1; ; attempt++) {
    const session = await startPairing(options)
    await onCode(session, attempt)

    try {
      return await pollForPairingToken({ studioUrl: options.studioUrl, session, signal: options.signal, onRetry })
    } catch (error) {
      if (!(error instanceof PairingExpiredError) || attempt >= maxAttempts) {
        throw error
      }
    }
  }
}

const REFRESH_TIMEOUT_MS = 15_000

export type RefreshAgentTokenOptions = {
  studioUrl?: string
  token: string
  /**
   * The secret the machine paired with.
   */
  machineId: string
  /**
   * The stored agent key, which signs the request.
   */
  privateKey?: string
  signal?: AbortSignal
  /**
   * How long to wait for an answer, in milliseconds.
   *
   * @default 15000
   */
  timeout?: number
}

export type RenewedAgentToken = {
  token: string
  /** Seconds until `token` expires. Only an `mcp` agent's token has one, an hour. */
  expiresIn?: number
}

/**
 * Trades the agent's token for a new one and resolves how long it lasts. The old token stops working
 * at once, so store the new one first. Resolves `null` when there is nothing to refresh, and rejects
 * with {@link InvalidAgentTokenError} when the token is refused.
 */
export async function renewAgentToken({
  studioUrl = defaultStudioUrl,
  token,
  machineId,
  privateKey,
  signal,
  timeout = REFRESH_TIMEOUT_MS,
}: RefreshAgentTokenOptions): Promise<RenewedAgentToken | null> {
  const deadline = AbortSignal.timeout(timeout)
  const signedAt = Date.now()
  const proof: TokenRefreshProof | undefined = privateKey
    ? {
        signed_at: signedAt,
        signature: signAgentPayload({ privateKey, context: AgentSignatureContext.TOKEN_REFRESH, payload: getTokenRefreshPayload({ token, signedAt }) }),
      }
    : undefined
  const { status, _data } = await ofetch
    .raw<{ token?: unknown; expires_in?: unknown }>(secureUrl({ studioUrl, path: '/api/agent/token/refresh' }).href, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { machine_id: machineId, ...proof },
      redirect: 'error',
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      ignoreResponseError: true,
      // A second attempt would send a token the first may have retired.
      retry: 0,
    })
    .catch((error: unknown) => {
      if (deadline.aborted && !signal?.aborted)
        throw new Diagnostics.Error({
          code: Diagnostics.code.inputRequestFailed,
          severity: 'error',
          message: `Kubb Studio did not answer the token refresh within ${timeout} ms`,
          help: 'The token is unchanged. Try again later.',
        })
      throw error
    })

  if (status === 404 || status === 409) return null
  if (status === 401) throw new InvalidAgentTokenError(studioUrl)
  if (status < 200 || status >= 300)
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequestFailed,
      severity: 'error',
      message: `Kubb Studio answered the token refresh with status ${status}`,
      help: 'The token is unchanged. Try again later.',
    })
  if (typeof _data?.token !== 'string' || !_data.token)
    throw new Diagnostics.Error({ code: Diagnostics.code.unknown, severity: 'error', message: 'Kubb Studio answered the token refresh without a token' })

  return { token: _data.token, expiresIn: toExpiresIn(_data.expires_in) }
}

// `expires_in` crosses the network, so only a positive, finite number of seconds counts.
function toExpiresIn(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

/** Prefix of a one-time pairing code from the `kubb_studio_connect` MCP tool. */
export const PAIRING_CODE_PREFIX = 'kubb_pair_'

/**
 * Why Studio refused a pairing code:
 * - `invalid_grant`: the code is unknown, already used, or its connection was revoked.
 * - `expired_token`: the code is older than its 5 minutes.
 * - `access_denied`: the plan's MCP agent limit is reached.
 */
export type PairingCodeErrorCode = 'invalid_grant' | 'expired_token' | 'access_denied'

const PAIRING_CODE_MESSAGES: Record<PairingCodeErrorCode, string> = {
  invalid_grant: 'Kubb Studio did not accept the pairing code. It is unknown, already used, or its connection was revoked.',
  expired_token: 'The pairing code expired. Codes last 5 minutes.',
  access_denied: 'Kubb Studio refused the pairing: the plan reached its MCP agent limit.',
}

/** Thrown when Studio refuses a pairing code. Never send that code again. */
export class PairingCodeError extends Diagnostics.Error {
  readonly code: PairingCodeErrorCode

  constructor({ code, description }: { code: PairingCodeErrorCode; description?: string }) {
    // Studio's own words may already ask for a new code, which `help` says once.
    const sentence = description
      ?.trim()
      .replace(/(?<![.!?])$/, '.')
      .replace(/\s*Ask the MCP client for a new (?:one|code)\.$/i, '')
    super({
      code: Diagnostics.code.studioRefused,
      severity: 'error',
      message: sentence || PAIRING_CODE_MESSAGES[code],
      help: code === 'access_denied' ? 'Remove an MCP agent in Studio, or upgrade the plan.' : 'Ask the MCP client for a new code.',
    })
    this.name = 'PairingCodeError'
    this.code = code
  }
}

export type RedeemedPairing = PairingResult & {
  /** Seconds until `token` expires: 3600 for an `mcp` agent. */
  expiresIn: number
}

export type RedeemPairingCodeOptions = {
  studioUrl?: string
  /** The one-time `kubb_pair_` code. Never log it. */
  pairingCode: string
  name: string
  /** A stable machine secret. Only its SHA-256 is sent, so pairing again finds the same agent. */
  machineId: string
  /** The agent key from `generateAgentKey`, which signs every handshake and refresh. Only its public half is sent. */
  privateKey: string
  signal?: AbortSignal
}

type RedeemResponse = {
  token?: unknown
  expires_in?: unknown
  agent?: unknown
  error?: unknown
  error_description?: unknown
}

/**
 * Redeems a one-time pairing code for an agent token, with no person approving it. Studio answers
 * at once, so nothing polls, and a refused code is never sent again.
 *
 * @throws {PairingCodeError} when Studio refuses the code.
 * @throws {PairingCanceledError} when `signal` aborts.
 */
export async function redeemPairingCode({
  studioUrl = defaultStudioUrl,
  pairingCode,
  name,
  machineId,
  privateKey,
  signal,
}: RedeemPairingCodeOptions): Promise<RedeemedPairing> {
  const url = secureUrl({ studioUrl, path: '/api/agent/token' }).href
  const { status, _data } = await ofetch
    .raw<RedeemResponse>(url, {
      method: 'POST',
      body: {
        pairing_code: pairingCode,
        machine_token: hash('sha256', machineId),
        name,
        public_key: getAgentPublicKey(privateKey),
      },
      // A redirect would send the code, and later the token, to wherever it points.
      redirect: 'error',
      signal,
      ignoreResponseError: true,
      // A second attempt would send a code the first may have spent.
      retry: 0,
    })
    .catch((error: unknown) => {
      if (signal?.aborted) throw new PairingCanceledError()
      throw new Diagnostics.Error({
        code: Diagnostics.code.inputRequestFailed,
        severity: 'error',
        message: `Could not reach Kubb Studio to redeem the pairing code: ${toError(error).message.replaceAll(pairingCode, '[redacted]')}`,
        help: 'The code may still be valid. Check the network and run the command again before it expires.',
      })
    })

  const data: RedeemResponse = _data && typeof _data === 'object' ? _data : {}
  // Studio's own words are passed on, never the code, should an answer ever echo it.
  const redact = (text: unknown) => (typeof text === 'string' && text ? text.replaceAll(pairingCode, '[redacted]') : undefined)
  const description = redact(data.error_description)
  if (typeof data.error === 'string' && Object.hasOwn(PAIRING_CODE_MESSAGES, data.error)) {
    throw new PairingCodeError({ code: data.error as PairingCodeErrorCode, description })
  }
  const expiresIn = toExpiresIn(data.expires_in)
  if (status < 200 || status >= 300 || typeof data.token !== 'string' || !data.token || !isAgent(data.agent) || expiresIn === undefined) {
    const reason = redact(data.error)
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequestFailed,
      severity: 'error',
      message: description ?? `Kubb Studio answered the pairing code with status ${status}${reason ? ` (${reason})` : ''}`,
      help: 'Ask the MCP client for a new code, then try again.',
    })
  }

  return { token: data.token, agent: data.agent, expiresIn }
}

function isAgent(agent: unknown): agent is PairingResult['agent'] {
  if (!agent || typeof agent !== 'object') return false
  const { id, slug, name } = agent as Record<string, unknown>
  return typeof id === 'string' && typeof slug === 'string' && typeof name === 'string'
}
