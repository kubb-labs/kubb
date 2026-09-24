import { agentDefaults } from './constants.ts'
import type { InvalidAgentTokenError } from './api.ts'
import { REGISTER_RETRIES, registerAgent } from './api.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

export type ClientOptions = Omit<StudioSessionOptions, 'signal' | 'onTokenRejected' | 'startupWarning'> & {
  /**
   * Called once when a live pool's token is rejected during background reconnect (401: revoked, or
   * the agent was deleted). The whole pool is already stopped by the time this fires, so a host
   * only needs to get a replacement token and start a new client.
   *
   * Never fires for a startup rejection, which `connect()` reports by throwing, nor for an ordinary
   * session expiry or revocation, both of which reconnect on their own.
   */
  onAuthRequired?: (error: InvalidAgentTokenError) => void
}

export type Client = {
  /**
   * Registers with Studio and opens the session pool. Resolves once the pool is starting: the
   * sessions keep running, and reconnect on their own, until `disconnect` is called.
   */
  connect: () => Promise<void>
  /**
   * Closes every session and stops reconnecting.
   */
  disconnect: () => void
}

/**
 * Creates the Kubb Studio client: the connection, the command loop, and the generation event
 * stream shared by the `kubb studio` CLI command and the Docker agent.
 *
 * Every permission is off by default. A host that wants more grants it explicitly. The machine
 * identity comes from the storage the host installed with `setStorage`, before connecting.
 *
 * @example
 * ```ts
 * const studio = createClient({ token, configPath, version, loadConfig: () => loadMyConfig() })
 * await studio.connect()
 * ```
 */
export function createClient({ onAuthRequired, ...options }: ClientOptions): Client {
  const controller = new AbortController()
  const poolSize = options.poolSize ?? agentDefaults.poolSize
  function notifyAuthRequired(error: InvalidAgentTokenError) {
    // Several pool sessions can reject the same token at once, and a host can stop the pool
    // itself, so an aborted controller is what says this callback is spent.
    if (controller.signal.aborted) {
      return
    }

    // Stop the whole pool first: every session's socket closes and every pending retry timer is
    // canceled through the `signal` each one already listens on, so the caller starts its next
    // client from a clean slate.
    controller.abort()
    onAuthRequired?.(error)
  }

  return {
    async connect() {
      const registered = await registerAgent({ token: options.token, studioUrl: options.studioUrl ?? agentDefaults.studioUrl, poolSize })
      if (controller.signal.aborted) {
        return
      }
      // Not fatal, since session creation registers again when Studio rejects the machine token.
      // Reported through the first session only, so a pool warns once.
      const startupWarning = registered ? undefined : `Could not register with Kubb Studio after ${REGISTER_RETRIES + 1} attempts, continuing`

      // Each slot is its own session, so one Studio user never sees another's generation events.
      // Awaited: `connect()` only ever rejects with `InvalidAgentTokenError` (every other failure
      // is retried internally through the session's own reconnect loop and resolves normally), so
      // awaiting here surfaces a dead token to the caller without blocking on a down Studio.
      await Promise.all(
        Array.from({ length: poolSize }, (_, slot) =>
          new StudioSession({
            ...options,
            signal: controller.signal,
            onTokenRejected: notifyAuthRequired,
            startupWarning: slot === 0 ? startupWarning : undefined,
          }).start(),
        ),
      )
    },
    disconnect() {
      controller.abort()
    },
  }
}
