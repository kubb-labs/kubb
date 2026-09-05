import { InvalidAgentTokenError } from './api.ts'
import { type ClientOptions, createClient } from './client.ts'

/**
 * Why a connection ended: the host asked it to stop through its `signal`, or the host declined to
 * replace a rejected token.
 */
export type ConnectionOutcome = 'shutdown' | 'stopped'

/**
 * A rejected token, and whether it was already serving a live session when Studio rejected it.
 */
export type TokenRejection<TCredentials> = {
  error: InvalidAgentTokenError
  /**
   * The credential Studio rejected, so a host can carry parts of it into the replacement.
   */
  credentials: TCredentials
  /**
   * `false` when the token was dead before a session ever opened, which is what `connect()` itself
   * reports. `true` when a live pool's background reconnect was rejected, well after the session
   * was up. Hosts treat the two differently: only the first has nothing to tear down.
   */
  live: boolean
}

export type ConnectionOptions<TCredentials extends { token: string }> = {
  /**
   * The credential to open with. Only its token is read here, so a host keeps whatever else it
   * stores alongside.
   */
  credentials: TCredentials
  /**
   * Builds the client options for one attempt. Called again for every reconnect, so a host whose
   * options depend on which agent approved, such as the permissions it granted, re-derives them
   * rather than reusing the ones the rejected token was opened with.
   */
  clientOptions: (credentials: TCredentials) => Omit<ClientOptions, 'token' | 'onAuthRequired'>
  /**
   * Called when Studio rejects the token. Return the credential to reconnect with, or `null` to
   * end the run. Throwing fails it, which is what a host does when it cannot pair again.
   */
  onTokenRejected: (rejection: TokenRejection<TCredentials>) => Promise<TCredentials | null>
  /**
   * Aborting this disconnects and ends the run. Hosts wire it to their own shutdown: `SIGINT` in
   * the CLI, Nitro's `close` hook in the Docker agent.
   */
  signal?: AbortSignal
}

/**
 * Waits for whichever comes first: the shutdown signal, or Studio rejecting the token during a
 * background reconnect. Resolves with the rejection, or nothing when the run is being shut down.
 */
function waitForRejection(authRequired: Promise<InvalidAgentTokenError>, signal?: AbortSignal): Promise<InvalidAgentTokenError | undefined> {
  // `{ once: true }` drops the listener when the abort fires, not when the other side settles the
  // race, so `settled` covers that half. Without it a reconnected run leaves one behind on the
  // host's signal for every attempt it makes.
  const settled = new AbortController()
  const shutdown = new Promise<undefined>((resolve) => {
    if (!signal) {
      return
    }
    if (signal.aborted) {
      resolve(undefined)
      return
    }
    signal.addEventListener('abort', () => resolve(undefined), { once: true, signal: settled.signal })
  })

  return Promise.race([shutdown, authRequired]).finally(() => settled.abort())
}

/**
 * Keeps a host connected to Studio across token changes: it opens a client, waits until the run
 * ends or Studio rejects the token, and reconnects with whatever credential the host hands back.
 *
 * The host owns everything around that. Where credentials live, whether a rejected token may be
 * replaced, and how any of it is reported are all decisions `onTokenRejected` makes.
 *
 * @example
 * ```ts
 * const outcome = await runConnection({
 *   credentials,
 *   clientOptions: () => ({ studioUrl, configPath, version, loadConfig }),
 *   signal: shutdown.signal,
 *   onTokenRejected: ({ error, live }) => pairAgain(error, live),
 * })
 * ```
 */
export async function runConnection<TCredentials extends { token: string }>({
  credentials,
  clientOptions,
  onTokenRejected,
  signal,
}: ConnectionOptions<TCredentials>): Promise<ConnectionOutcome> {
  let current = credentials

  // Each pass is one connection attempt: it ends the run, or produces the credential the next
  // attempt opens with.
  while (true) {
    // A shutdown can land outside the race below, while a host is pairing or prompting. Registering
    // one more agent with Studio only to drop it again is not what the operator asked for.
    if (signal?.aborted) {
      return 'shutdown'
    }

    const { promise: authRequired, resolve: notifyAuthRequired } = Promise.withResolvers<InvalidAgentTokenError>()
    const client = createClient({ ...clientOptions(current), token: current.token, onAuthRequired: notifyAuthRequired })

    let rejection: TokenRejection<TCredentials> | undefined

    try {
      await client.connect()

      const error = await waitForRejection(authRequired, signal)

      client.disconnect()

      if (!error) {
        return 'shutdown'
      }

      rejection = { error, credentials: current, live: true }
    } catch (error) {
      // Every other failure is retried inside the session's own reconnect loop, so anything that
      // surfaces here is a dead token or a host's own bug.
      if (!(error instanceof InvalidAgentTokenError)) {
        throw error
      }

      client.disconnect()

      rejection = { error, credentials: current, live: false }
    }

    const next = await onTokenRejected(rejection)

    if (!next) {
      return 'stopped'
    }

    current = next
  }
}
