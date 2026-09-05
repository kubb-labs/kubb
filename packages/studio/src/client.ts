import type { Storage } from 'unstorage'
import { agentDefaults } from './constants.ts'
import type { InvalidAgentTokenError } from './api.ts'
import { registerAgent } from './api.ts'
import { type ConnectToStudioOptions, connectToStudio } from './connectStudio.ts'
import { setStorage } from './machine.ts'

export type ClientOptions = Omit<ConnectToStudioOptions, 'signal' | 'onTokenRejected'> & {
  /**
   * Where the machine secret and the last Studio config are persisted. Defaults to in-memory,
   * which gives up a stable machine identity across restarts.
   */
  storage?: Storage
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
 * Every permission is off by default. A host that wants more grants it explicitly.
 *
 * @example
 * ```ts
 * const studio = createClient({ token, configPath, version, loadConfig: () => loadMyConfig() })
 * await studio.connect()
 * ```
 */
export function createClient({ storage, onAuthRequired, ...options }: ClientOptions): Client {
  if (storage) {
    setStorage(storage)
  }

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
      await registerAgent({ token: options.token, studioUrl: options.studioUrl ?? agentDefaults.studioUrl, poolSize })

      // Each slot is its own session, so one Studio user never sees another's generation events.
      // Awaited: `connectToStudio` only ever rejects with `InvalidAgentTokenError` (every other
      // failure is retried internally through its own reconnect loop and resolves normally), so
      // awaiting here surfaces a dead token to the caller without blocking on a down Studio.
      await Promise.all(Array.from({ length: poolSize }, () => connectToStudio({ ...options, signal: controller.signal, onTokenRejected: notifyAuthRequired })))
    },
    disconnect() {
      controller.abort()
    },
  }
}
