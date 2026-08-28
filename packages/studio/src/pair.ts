import { ofetch } from 'ofetch'
import { agentDefaults } from './constants.ts'
import { sleep } from './logger.ts'
import { getMachineToken } from './machine.ts'

/**
 * Pairing is an RFC 8628 device authorization grant, served by Studio's auth layer. The CLI asks
 * for a code, shows it, and polls while the user approves it in a browser that is already signed
 * in. "Device" is the RFC's word for the grant; the thing being paired is a `cli` agent.
 */
export type PairingSession = {
  /**
   * Opaque handle the CLI polls with. Never shown to the user.
   */
  device_code: string
  /**
   * The short code the user checks against the one on the approval page.
   */
  user_code: string
  /**
   * Where the user approves, without the code filled in.
   */
  verification_uri: string
  /**
   * Same page with the code prefilled, so `--open` needs nothing typed.
   */
  verification_uri_complete: string
  /**
   * Seconds until `user_code` expires.
   */
  expires_in: number
  /**
   * Seconds to wait between polls.
   */
  interval: number
}

export type PairingResult = {
  /**
   * Bearer token for this machine. Store it with mode 0600 and never log it.
   */
  token: string
  agent: {
    id: string
    slug: string
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
}

/**
 * Asks Studio for a pairing code. The machine token travels with the request and is stored against
 * the code, so approval knows which machine it is pairing: the same machine pairing twice rotates
 * one agent's token instead of creating a second agent.
 */
export async function startPairing({ studioUrl = agentDefaults.studioUrl, name, hostname }: StartPairingOptions): Promise<PairingSession> {
  return ofetch<PairingSession>(`${studioUrl}/api/auth/device/code`, {
    method: 'POST',
    body: {
      client_id: CLIENT_ID,
      name,
      hostname,
      machine_token: await getMachineToken(),
    },
  })
}

type PollOptions = {
  studioUrl?: string
  session: PairingSession
}

type PollResponse = PairingResult | { error: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | 'invalid_grant' }

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

    const response = await ofetch<PollResponse>(`${studioUrl}/api/agent/pair/token`, {
      method: 'POST',
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
      throw new Error('Pairing was denied in the browser')
    }

    if (response.error === 'expired_token' || response.error === 'invalid_grant') {
      throw new Error('The pairing code expired, run `kubb studio login` again')
    }

    if (response.error === 'slow_down') {
      intervalMs += 5_000
    }
  }

  throw new Error('The pairing code expired, run `kubb studio login` again')
}
