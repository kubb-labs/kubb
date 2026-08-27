import { version as kubbVersion } from 'kubb/package.json'
import type { Storage } from 'unstorage'
import { agentDefaults } from './constants.ts'
import { registerAgent } from './utils/api.ts'
import { type ConnectToStudioOptions, connectToStudio } from './utils/connectStudio.ts'
import { logger } from './utils/logger.ts'
import { setStorage } from './utils/storage.ts'

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
      logger.info(`Kubb Studio client v${options.version} (kubb v${kubbVersion})`)

      await registerAgent({ token: options.token, studioUrl: options.studioUrl ?? agentDefaults.studioUrl, poolSize })

      // Each slot is its own session, so one Studio user never sees another's generation events.
      // Not awaited: a slot retrying against a down Studio must not block the others, or the host's
      // startup. `connectToStudio` owns the retry loop for the lifetime of the slot.
      for (let index = 0; index < poolSize; index++) {
        void connectToStudio({ ...options, signal: controller.signal }).catch((error: unknown) => {
          logger.warn(`Session ${index + 1}/${poolSize} failed to connect`, error instanceof Error ? error.message : String(error))
        })
      }
    },
    disconnect() {
      controller.abort()
    },
  }
}

export { agentDefaults, maxHeartbeatIntervalMs } from './constants.ts'
export { logger } from './utils/logger.ts'
export { maskString } from './utils/internals.ts'
export { createFileStorage, setStorage } from './utils/storage.ts'
export { pollForPairingToken, startPairing, type PairingResult, type PairingSession } from './pair.ts'
