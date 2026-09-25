import { randomUUID } from 'node:crypto'
import type { InvalidAgentTokenError } from './api.ts'
import { StudioSession, type StudioSessionOptions } from './StudioSession.ts'

export type ClientOptions = Omit<StudioSessionOptions, 'signal' | 'onTokenRejected' | 'reconnectAttempt'> & {
  /**
   * Called once when the token is rejected during a background reconnect (401: revoked, or the
   * agent was deleted). The client is already stopped by the time this fires, so a host only needs
   * to get a replacement token and start a new client.
   *
   * Never fires for a startup rejection, which `connect()` reports by throwing, nor for an ordinary
   * session expiry or revocation, both of which reconnect on their own.
   */
  onAuthRequired?: (error: InvalidAgentTokenError) => void
}

export type Client = {
  /**
   * Registers with Studio and opens this process's one socket. Resolves once it is starting: the
   * connection keeps running, and reconnects on its own, until `disconnect` is called.
   */
  connect: () => Promise<void>
  /**
   * Closes the socket and stops reconnecting.
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
  // One per process: a reconnect keeps it, so Studio sees the same instance come back, and a
  // restart gets a new one. A host that queues its own jobs, such as a CI run, passes one in so it
  // can pin those jobs to this process.
  const instanceId = options.instanceId ?? randomUUID()

  function notifyAuthRequired(error: InvalidAgentTokenError) {
    // A host can stop the client itself, so an aborted controller is what says this callback is spent.
    if (controller.signal.aborted) {
      return
    }

    // Stop first: the socket closes and any pending retry timer is canceled through the `signal`
    // the session listens on, so the caller starts its next client from a clean slate.
    controller.abort()
    onAuthRequired?.(error)
  }

  return {
    async connect() {
      // Awaited: `connect()` only rejects with `InvalidAgentTokenError` or `IncompatibleAgentError`
      // (every other failure is retried through the session's own reconnect loop and resolves
      // normally), so awaiting surfaces a dead token or a too-old agent without blocking on a
      // down Studio.
      await new StudioSession({ ...options, instanceId, signal: controller.signal, onTokenRejected: notifyAuthRequired }).start()
    },
    disconnect() {
      controller.abort()
    },
  }
}
