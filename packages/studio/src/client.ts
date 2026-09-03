import type { Storage } from 'unstorage'
import { agentDefaults } from './constants.ts'
import { registerAgent } from './api.ts'
import { type ConnectToStudioOptions, connectToStudio } from './connectStudio.ts'
import { setStorage } from './machine.ts'

export type ClientOptions = Omit<ConnectToStudioOptions, 'signal'> & {
  /**
   * Where the machine secret and the last Studio config are persisted. Defaults to in-memory,
   * which gives up a stable machine identity across restarts.
   */
  storage?: Storage
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
export function createClient({ storage, ...options }: ClientOptions): Client {
  if (storage) {
    setStorage(storage)
  }

  const controller = new AbortController()
  const poolSize = options.poolSize ?? agentDefaults.poolSize

  return {
    async connect() {
      await registerAgent({ token: options.token, studioUrl: options.studioUrl ?? agentDefaults.studioUrl, poolSize })

      // Each slot is its own session, so one Studio user never sees another's generation events.
      // Awaited: `connectToStudio` only ever rejects with `InvalidAgentTokenError` (every other
      // failure is retried internally through its own reconnect loop and resolves normally), so
      // awaiting here surfaces a dead token to the caller without blocking on a down Studio.
      await Promise.all(Array.from({ length: poolSize }, () => connectToStudio({ ...options, signal: controller.signal })))
    },
    disconnect() {
      controller.abort()
    },
  }
}
