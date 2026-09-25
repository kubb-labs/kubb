import { setTimeout as delay } from 'node:timers/promises'
import { toError } from '@internals/utils'
import { ofetch } from 'ofetch'
import { agentDefaults } from './constants.ts'
import { getMachineToken } from './machine.ts'

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

type StartPairingOptions = {
  studioUrl?: string
  type: PairingAgentType
  /**
   * Display name for the agent, usually the project or machine name.
   */
  name: string
  hostname: string
  /**
   * Aborting this cancels the request in flight and rejects with {@link PairingCanceledError}.
   */
  signal?: AbortSignal
}

/**
 * Asks Studio for a pairing code. The machine token travels with the request and is stored against
 * the code, so approval knows which machine it is pairing: the same machine pairing twice rotates
 * one agent's token instead of creating a second agent.
 */
export async function startPairing({ studioUrl = agentDefaults.studioUrl, type, name, hostname, signal }: StartPairingOptions): Promise<PairingSession> {
  try {
    return await ofetch<PairingSession>(`${studioUrl}/api/auth/device/code`, {
      method: 'POST',
      body: {
        client_id: type === 'cli' ? CLIENT_IDS.cli : CLIENT_IDS.agent,
        name,
        hostname,
        machine_token: await getMachineToken(),
        agent_kind: type === 'cli' ? undefined : type,
      },
      signal,
    })
  } catch (error) {
    if (signal?.aborted) {
      throw new PairingCanceledError()
    }

    throw error
  }
}

type PollOptions = {
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

function isPairingResult(response: PollResponse | undefined): response is PairingResult {
  return !!response && typeof response === 'object' && 'token' in response && typeof response.token === 'string'
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
export async function pollForPairingToken({ studioUrl = agentDefaults.studioUrl, session, signal, onRetry }: PollOptions): Promise<PairingResult> {
  // Both fields cross the network, so neither is trusted as-is: a missing or zero `interval` would
  // spin the poll loop, and a missing or zero `expires_in` would expire the code before the first
  // poll. `> 0` is also false for `NaN` and for a missing field, so it doubles as the type guard.
  const deadline = Date.now() + (session.expires_in > 0 ? session.expires_in : 600) * 1000
  let intervalMs = (session.interval > 0 ? session.interval : 5) * 1000

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      throw new PairingCanceledError()
    }

    try {
      await delay(intervalMs, undefined, { signal })
    } catch {
      throw new PairingCanceledError()
    }

    let response: PollResponse | undefined
    try {
      response = await ofetch<PollResponse | undefined>(`${studioUrl}/api/agent/token`, {
        method: 'POST',
        body: { device_code: session.device_code },
        // A denial, an expiry, and "not yet" all come back as 4xx with a body the caller needs to
        // read, so let every response through and switch on `error` instead of catching.
        ignoreResponseError: true,
        signal,
      })
    } catch (error) {
      if (signal?.aborted) {
        throw new PairingCanceledError()
      }

      // Studio can be briefly unreachable (a deploy) while the code is still valid, so retry.
      onRetry?.(toError(error))
      continue
    }

    if (isPairingResult(response)) {
      return response
    }

    if (!response || typeof response !== 'object' || !('error' in response) || typeof response.error !== 'string') {
      throw new Error('Kubb Studio returned an empty pairing response, pair again')
    }

    if (response.error === 'authorization_pending') {
      continue
    }

    if (response.error === 'slow_down') {
      intervalMs += 5_000
      continue
    }

    if (response.error === 'access_denied') {
      throw new PairingDeniedError(response.error_description)
    }

    if (response.error === 'expired_token' || response.error === 'invalid_grant') {
      throw new PairingExpiredError(response.error_description)
    }

    throw new Error(response.error_description ?? `Pairing failed (${response.error})`)
  }

  throw new PairingExpiredError()
}

type PairAgentOptions = StartPairingOptions & {
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
