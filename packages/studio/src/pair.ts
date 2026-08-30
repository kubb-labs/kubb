import { agentDefaults } from './constants.ts'
import { postJson } from './api.ts'
import { sleep } from './logger.ts'
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
  }
}

/**
 * Identifies the CLI to Studio's device authorization endpoint. A label, not a secret: what
 * authorizes a pairing is a signed-in person approving the code in the browser.
 */
const CLIENT_ID = 'kubb-cli'

type StartPairingOptions = {
  studioUrl?: string
  /**
   * Display name for the agent, usually the project or machine name.
   */
  name: string
  hostname: string
  /**
   * Which client is pairing. Defaults to the CLI, where any signed-in member may approve their own
   * machine. The Docker image passes `kubb-agent`, whose codes only an admin can approve.
   */
  clientId?: string
  /**
   * What a `kubb-agent` pairing asks to be registered as. Studio rejects the request without it,
   * and ignores it for the CLI.
   */
  agentKind?: 'user' | 'sandbox'
}

/**
 * Asks Studio for a pairing code. The machine token travels with the request and is stored against
 * the code, so approval knows which machine it is pairing: the same machine pairing twice rotates
 * one agent's token instead of creating a second agent.
 */
export async function startPairing({
  studioUrl = agentDefaults.studioUrl,
  name,
  hostname,
  clientId = CLIENT_ID,
  agentKind,
}: StartPairingOptions): Promise<PairingSession> {
  return postJson<PairingSession>(`${studioUrl}/api/auth/device/code`, {
    body: {
      client_id: clientId,
      name,
      hostname,
      machine_token: await getMachineToken(),
      agent_kind: agentKind,
    },
  })
}

type PollOptions = {
  studioUrl?: string
  session: PairingSession
}

type PollResponse =
  | PairingResult
  | {
      error: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | 'invalid_grant'
      /**
       * Why, when Studio has something more useful to say than the RFC code. An approval that hits
       * the organization's agent limit comes back as `access_denied` with the limit spelled out.
       */
      error_description?: string
    }

/**
 * Polls until the user approves or denies, honoring the server's `slow_down` back-off.
 *
 * Studio's own endpoint is used rather than the auth layer's `/device/token`, because an approved
 * Kubb pairing is worth an agent bearer token, not a user session.
 *
 * @throws when the code expires or the user denies it.
 */
export async function pollForPairingToken({ studioUrl = agentDefaults.studioUrl, session }: PollOptions): Promise<PairingResult> {
  const deadline = Date.now() + session.expires_in * 1000
  let intervalMs = session.interval * 1000

  while (Date.now() < deadline) {
    await sleep(intervalMs)

    const response = await postJson<PollResponse>(`${studioUrl}/api/agent/token`, {
      body: { device_code: session.device_code },
      // A denial, an expiry, and "not yet" all come back as 4xx with a body the caller needs to
      // read, so let every response through and switch on `error` instead of catching.
      ignoreResponseError: true,
    }).catch((error: unknown) => {
      throw new Error('Could not reach Kubb Studio while waiting for approval', { cause: error })
    })

    if (!('error' in response)) {
      return response
    }

    if (response.error === 'access_denied') {
      throw new Error(response.error_description ?? 'Pairing was denied in the browser')
    }

    if (response.error === 'expired_token' || response.error === 'invalid_grant') {
      throw new Error(response.error_description ?? 'The pairing code expired, pair again')
    }

    if (response.error === 'slow_down') {
      intervalMs += 5_000
    }
  }

  throw new Error('The pairing code expired, pair again')
}
